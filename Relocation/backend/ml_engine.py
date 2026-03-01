import pandas as pd
import numpy as np
import xgboost as xgb
import shap
import os
from sklearn.model_selection import train_test_split

class NammaWayMLEngine:
    def __init__(self):
        self.data_path = r"c:\SideQuest\ConsumerExperience\datasets\nammaway_training_data.csv"
        self.model = None
        self.explainer = None
        self._train_model()

    def _train_model(self):
        if not os.path.exists(self.data_path):
            print("Training data not found. Run data_fusion.py first.")
            return

        df = pd.read_csv(self.data_path)
        
        # Features: [rent, food_index, utility_index, lifestyle_multiplier, dist_to_center]
        X = df[['rent', 'food_index', 'utility_index', 'lifestyle_multiplier', 'dist_to_center']]
        y = df['total_monthly_spend']

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        self.model = xgb.XGBRegressor(
            objective='reg:squarederror',
            n_estimators=100,
            learning_rate=0.1,
            max_depth=5
        )
        self.model.fit(X_train, y_train)
        
        # Initialize SHAP explainer
        self.explainer = shap.TreeExplainer(self.model)
        print("XGBoost Model trained with SHAP explainer initialized.")

    def calculate_tneb_bill(self, units):
        """
        TNEB Slab Logic (Simplified for Coimbatore Domestic)
        0-100: Free
        101-200: 2.25/unit
        201-400: 4.50/unit
        401-500: 6.00/unit
        501+: 9.00/unit (Aggressive slab jump)
        """
        if units <= 100:
            return 0
        elif units <= 200:
            return (units - 100) * 2.25
        elif units <= 400:
            return (100 * 2.25) + (units - 200) * 4.50
        elif units <= 500:
            return (100 * 2.25) + (200 * 4.50) + (units - 400) * 6.00
        else:
            return (100 * 2.25) + (200 * 4.50) + (100 * 6.00) + (units - 500) * 9.00

    def predict_survival_cost(self, rent, food_index, utility_index, lifestyle_multiplier, dist_to_center, ac_hours):
        # 1. Base ML Prediction
        input_data = pd.DataFrame([[rent, food_index, utility_index, lifestyle_multiplier, dist_to_center]], 
                                 columns=['rent', 'food_index', 'utility_index', 'lifestyle_multiplier', 'dist_to_center'])
        
        base_prediction = self.model.predict(input_data)[0]

        # 2. TNEB Post-Processing
        # Estimate units: Base 100 units + (AC_hours * 1.5 units/hr * 30 days)
        ac_units = ac_hours * 1.5 * 30
        total_units = 100 + ac_units
        elec_bill = self.calculate_tneb_bill(total_units)
        
        # SLAB JUMP PENALTY: Logic if AC usage > 6 hrs/day
        slab_jump_penalty = 0
        if ac_hours > 6:
            slab_jump_penalty = 1200
        
        # Adjust prediction (subtract baseline utility from ML and add specific TNEB)
        final_prediction = base_prediction + elec_bill + slab_jump_penalty

        # 3. SHAP Explanation
        shap_values = self.explainer.shap_values(input_data)
        feature_importance = dict(zip(input_data.columns, shap_values[0]))
        
        # Add TNEB and Slab Jump as manual feature importance entries
        feature_importance['tneb_electricity'] = elec_bill
        feature_importance['slab_jump_penalty'] = slab_jump_penalty

        return {
            "predicted_cost": round(float(final_prediction), 2),
            "breakdown": {
                "base_rent": round(float(rent), 2),
                "electricity_bill": round(float(elec_bill + slab_jump_penalty), 2),
                "estimated_food": round(float(food_index * 2 * 30 * lifestyle_multiplier), 2)
            },
            "explanations": feature_importance,
            "units_consumed": round(total_units, 2),
            "slab_jump_active": ac_hours > 6
        }

    def optimize_budget(self, current_params):
        """
        Scenario Optimization (The Budget Saver)
        Tries reducing AC hours, switching lifestyle, or showing rent impact.
        """
        optimizations = []
        
        # Optimization 1: AC Usage Reduction (Avoid Slab Jump)
        if current_params['ac_hours'] > 6:
            # Drop to 6 to save slab jump
            optimized_params = current_params.copy()
            optimized_params['ac_hours'] = 6
            original = self.predict_survival_cost(**current_params)
            new_pred = self.predict_survival_cost(**optimized_params)
            savings = original['predicted_cost'] - new_pred['predicted_cost']
            optimizations.append({
                "type": "Budget Saver: Slab Jump Avoidance",
                "suggestion": "Reduce AC usage to 6 hours or less to avoid the ₹1,200 TNEB slab jump penalty.",
                "savings": round(savings, 2)
            })
        elif current_params['ac_hours'] > 2:
            reduced_ac = current_params['ac_hours'] - 2
            original = self.predict_survival_cost(**current_params)
            optimized_params = current_params.copy()
            optimized_params['ac_hours'] = reduced_ac
            new_pred = self.predict_survival_cost(**optimized_params)
            savings = original['predicted_cost'] - new_pred['predicted_cost']
            optimizations.append({
                "type": "AC Optimization",
                "suggestion": f"Reduce AC usage by 2 hours/day for significant electricity savings.",
                "savings": round(savings, 2)
            })

        # Optimization 2: Lifestyle switch
        if current_params['lifestyle_multiplier'] > 1.0:
            original = self.predict_survival_cost(**current_params)
            optimized_params = current_params.copy()
            optimized_params['lifestyle_multiplier'] = 1.0
            new_pred = self.predict_survival_cost(**optimized_params)
            savings = original['predicted_cost'] - new_pred['predicted_cost']
            optimizations.append({
                "type": "Lifestyle Adjustment",
                "suggestion": "Switch from Premium to Balanced lifestyle (less cab usage & moderate dining).",
                "savings": round(savings, 2)
            })

        return optimizations

if __name__ == "__main__":
    # Test
    engine = NammaWayMLEngine()
    result = engine.predict_survival_cost(8500, 400, 1500, 1.5, 3.2, 6)
    print(result)
    print(engine.optimize_budget({'rent': 8500, 'food_index': 400, 'utility_index': 1500, 'lifestyle_multiplier': 1.5, 'dist_to_center': 3.2, 'ac_hours': 6}))
