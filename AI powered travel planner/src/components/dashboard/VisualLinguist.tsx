import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Scan, Info, Utensils, IndianRupee, Sparkles } from 'lucide-react';
import gsap from 'gsap';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CameraUploader from './CameraUploader.tsx';

interface VisualLinguistProps {
    onBack?: () => void;
}

const VisualLinguist = ({ onBack }: VisualLinguistProps) => {
    return (
        <div className="w-full max-w-4xl mx-auto p-4">
            <div className="w-full bg-slate-50/50 backdrop-blur-xl rounded-2xl md:rounded-3xl border border-slate-200/60 shadow-xl overflow-hidden min-h-[500px] flex items-center justify-center relative">

                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/2"></div>

                <div className="w-full max-w-xl relative z-10 p-4 md:p-8">
                    <CameraUploader />
                </div>
            </div>
        </div>
    );
};

export default VisualLinguist;
