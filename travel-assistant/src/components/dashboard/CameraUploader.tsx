import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, Upload, Loader2, Info, Sparkles, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const CameraUploader = () => {
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [response, setResponse] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            if (!file.type.startsWith('image/')) {
                setError('Please select a valid image file.');
                return;
            }
            setSelectedFile(file);
            setImagePreview(URL.createObjectURL(file));
            setResponse(null);
            setError(null);
        }
    };

    const handleClear = () => {
        setImagePreview(null);
        setSelectedFile(null);
        setResponse(null);
        setError(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (cameraInputRef.current) cameraInputRef.current.value = '';
    };

    const handleAnalyze = async () => {
        if (!selectedFile) return;

        setIsLoading(true);
        setError(null);
        setResponse(null);

        const formData = new FormData();
        formData.append('image', selectedFile);

        try {
            const res = await fetch('http://localhost:8000/api/visual-linguist', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.detail || data.error || 'Failed to process image');
            }

            if (data.error) {
                throw new Error(data.error);
            }

            setResponse(data.response);
        } catch (err: any) {
            setError(err.message || 'Nanba, I hit an error while trying to read the image!');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-lg mx-auto p-4 space-y-6">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
                    <Sparkles className="text-indigo-600 w-6 h-6" /> Visual Linguist
                </h2>
                <p className="text-gray-500 text-sm">
                    Upload an image or use your camera to let Kovai Buddy translate and estimate costs!
                </p>
            </div>

            <Card className="overflow-hidden shadow-lg border-slate-200">
                <CardContent className="p-6">
                    {/* Upload Controls */}
                    {!imagePreview ? (
                        <div className="flex flex-col gap-4">
                            <div className="border-2 border-dashed border-indigo-200 rounded-xl p-8 flex flex-col items-center justify-center bg-indigo-50/50 hover:bg-indigo-50 transition-colors">
                                <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                                    <ImageIcon className="w-8 h-8 text-indigo-400" />
                                </div>
                                <h3 className="font-semibold text-gray-700 mb-1">Pick an Image</h3>
                                <p className="text-xs text-gray-500 mb-6 text-center">Take a photo or upload from gallery</p>

                                <div className="flex w-full gap-3">
                                    <Button
                                        onClick={() => cameraInputRef.current?.click()}
                                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                                    >
                                        <Camera className="w-4 h-4 mr-2" /> Camera
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex-1 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                                    >
                                        <Upload className="w-4 h-4 mr-2" /> Gallery
                                    </Button>
                                </div>

                                {/* Hidden Inputs */}
                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    ref={cameraInputRef}
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                                <input
                                    type="file"
                                    accept="image/*"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </div>
                        </div>
                    ) : (
                        /* Selected Image View */
                        <div className="space-y-4">
                            <div className="relative rounded-xl overflow-hidden bg-slate-100 border border-slate-200 aspect-[4/3]">
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="w-full h-full object-contain"
                                />
                                {!isLoading && !response && (
                                    <button
                                        onClick={handleClear}
                                        className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white backdrop-blur-sm transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {!response && !isLoading && (
                                <Button
                                    onClick={handleAnalyze}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-6 rounded-xl shadow-md"
                                >
                                    <Sparkles className="w-5 h-5 mr-2" /> Analyze with Kovai Buddy
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center p-8 bg-indigo-50 rounded-xl mt-4 border border-indigo-100 animate-pulse">
                            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
                            <p className="text-indigo-800 font-medium">Buddy is reading the sign...</p>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-start gap-3">
                            <Info className="w-5 h-5 shrink-0 mt-0.5" />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}

                    {/* AI Response Card */}
                    {response && (
                        <div className="mt-4 bg-gradient-to-br from-indigo-50 to-white p-5 rounded-xl border border-indigo-100 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-100 rounded-bl-full -z-10 opacity-50"></div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md">Kovai Buddy says</span>
                            </div>
                            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                                {response}
                            </p>

                            <Button
                                variant="outline"
                                onClick={handleClear}
                                className="w-full mt-5 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                            >
                                Scan Another Image
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default CameraUploader;
