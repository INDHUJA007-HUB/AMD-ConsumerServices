import { createContext, useState, useContext, ReactNode } from 'react';
import { PGItem, HouseItem } from '@/services/datasetsApi'; // Assuming these types are exported

type Stay = PGItem | HouseItem;

interface AppContextType {
    analyzedStay: Stay | null;
    setAnalyzedStay: (stay: Stay | null) => void;
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const [analyzedStay, setAnalyzedStay] = useState<Stay | null>(null);
    const [activeTab, setActiveTab] = useState('stay');

    return (
        <AppContext.Provider value={{ analyzedStay, setAnalyzedStay, activeTab, setActiveTab }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
