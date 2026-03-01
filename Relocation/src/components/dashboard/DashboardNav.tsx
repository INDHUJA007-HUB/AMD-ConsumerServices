import { Home, Calculator, Utensils, Train, BedDouble, Building2, Users } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const navItems = [
    { to: '/dashboard/stay', icon: <Home className="h-5 w-5" />, label: 'Smart Stay' },
    { to: '/dashboard/expense', icon: <Calculator className="h-5 w-5" />, label: 'Predictive Expense' },
    { to: '/dashboard/travel', icon: <Train className="h-5 w-5" />, label: 'Travel Optimizer' },
    { to: '/dashboard/pgs', icon: <BedDouble className="h-5 w-5" />, label: 'PGs' },
    { to: '/dashboard/rent', icon: <Building2 className="h-5 w-5" />, label: 'Houses' },
];

const DashboardNav = () => {
    return (
        <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-xl overflow-x-auto">
            {navItems.map((item) => (
                <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                        `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isActive
                                ? 'bg-blue-500 text-white'
                                : 'text-gray-700 hover:bg-gray-200'
                        }`
                    }
                >
                    {item.icon}
                    {item.label}
                </NavLink>
            ))}
        </div>
    );
};

export default DashboardNav;
