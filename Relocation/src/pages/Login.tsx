
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Mail, Facebook, Github, Linkedin, Chrome, MapPin, Bot } from 'lucide-react';
import './Login.css'; // We'll create this next

const Login = () => {
    const [isActive, setIsActive] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [startingLocation, setStartingLocation] = useState('');
    const [workplace, setWorkplace] = useState('');
    const [purpose, setPurpose] = useState<'travelling' | 'relocation'>('travelling');
    const navigate = useNavigate();

    const handleRegisterClick = () => {
        setIsActive(true);
    };

    const handleLoginClick = () => {
        setIsActive(false);
    };

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Attempting login with:', { email: email || name });
        try {
            const response = await fetch('http://localhost:8000/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email || name, password })
            });
            const data = await response.json();
            console.log('Login response:', response.status, data);
            if (response.ok) {
                localStorage.setItem('token', data.access_token);
                localStorage.setItem('userName', name || email);
                navigate('/dashboard');
            } else {
                alert(`Login failed: ${data.detail || 'Check credentials'}`);
            }
        } catch (error) {
            console.error("Login error:", error);
            alert('Login failed. Make sure backend is running on http://localhost:8000');
        }
    };

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Submitting registration:', { email, password, name, startingLocation, workplace, purpose });
        try {
            const response = await fetch('http://localhost:8000/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    password,
                    full_name: name,
                    starting_location: startingLocation,
                    workplace: workplace,
                    purpose: purpose
                })
            });

            let data;
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                data = await response.json();
            } else {
                data = { detail: await response.text() };
            }

            console.log('Response:', response.status, data);

            if (response.ok) {
                localStorage.setItem('token', data.access_token);
                localStorage.setItem('userName', name);
                localStorage.setItem('startingLocation', startingLocation);
                localStorage.setItem('workplace', workplace);
                localStorage.setItem('purpose', purpose);
                navigate('/dashboard');
            } else {
                alert(`Registration failed (${response.status}): ${data.detail || JSON.stringify(data) || 'Unknown error'}`);
            }
        } catch (error) {
            console.error("Registration error:", error);
            alert(`Network error or Backend unreachable: ${error instanceof Error ? error.message : String(error)}`);
        }
    };

    return (
        <div className={`login-container-wrapper flex justify-center items-center min-h-screen bg-gradient-to-r from-[#e2e2e2] to-[#c9d6ff]`}>
            <div className={`container ${isActive ? 'active' : ''}`} id="container">
                <div className="form-box login">
                    <form onSubmit={handleLoginSubmit}>
                        <h1 className="text-4xl font-bold mb-4">Login</h1>
                        <div className="input-box relative my-6">
                            <input
                                type="text"
                                placeholder="Username"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full py-3 px-12 bg-[#eee] rounded-lg border-none outline-none text-base font-medium text-[#333]"
                            />
                            <User className="absolute right-5 top-1/2 -translate-y-1/2 text-xl text-[#333]" />
                        </div>
                        <div className="input-box relative my-6">
                            <input
                                type="password"
                                placeholder="Password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full py-3 px-12 bg-[#eee] rounded-lg border-none outline-none text-base font-medium text-[#333]"
                            />
                            <Lock className="absolute right-5 top-1/2 -translate-y-1/2 text-xl text-[#333]" />
                        </div>
                        <div className="forgot-link text-right -mt-2 mb-4">
                            <a href="#" className="text-sm text-[#333]">Forgot Password?</a>
                        </div>
                        <button type="submit" className="btn w-full h-12 bg-[#7494ec] rounded-lg text-white font-semibold shadow-md cursor-pointer">Login</button>
                        <p className="my-4 text-sm">or login with social platforms</p>
                        <div className="social-icons flex justify-center gap-2">
                            <a href="#" className="inline-flex p-2 border-2 border-[#ccc] rounded-lg text-[#333]"><Chrome /></a>
                            <a href="#" className="inline-flex p-2 border-2 border-[#ccc] rounded-lg text-[#333]"><Facebook /></a>
                            <a href="#" className="inline-flex p-2 border-2 border-[#ccc] rounded-lg text-[#333]"><Github /></a>
                            <a href="#" className="inline-flex p-2 border-2 border-[#ccc] rounded-lg text-[#333]"><Linkedin /></a>
                        </div>
                    </form>
                </div>

                <div className="form-box register">
                    <form onSubmit={handleRegisterSubmit}>
                        <h1 className="text-4xl font-bold mb-4">Registration</h1>
                        <div className="input-box relative my-6">
                            <input
                                type="text"
                                placeholder="Username"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full py-3 px-12 bg-[#eee] rounded-lg border-none outline-none text-base font-medium text-[#333]"
                            />
                            <User className="absolute right-5 top-1/2 -translate-y-1/2 text-xl text-[#333]" />
                        </div>

                        <div className="input-box relative my-6">
                            <input
                                type="email"
                                placeholder="Email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full py-3 px-12 bg-[#eee] rounded-lg border-none outline-none text-base font-medium text-[#333]"
                            />
                            <Mail className="absolute right-5 top-1/2 -translate-y-1/2 text-xl text-[#333]" />
                        </div>
                        <div className="input-box relative my-6">
                            <input
                                type="password"
                                placeholder="Password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full py-3 px-12 bg-[#eee] rounded-lg border-none outline-none text-base font-medium text-[#333]"
                            />
                            <Lock className="absolute right-5 top-1/2 -translate-y-1/2 text-xl text-[#333]" />
                        </div>
                        <div className="input-box relative my-4">
                            <label className="text-sm font-medium text-[#333] mb-2 block">What are you using NammaWay for?</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="purpose"
                                        value="travelling"
                                        checked={purpose === 'travelling'}
                                        onChange={() => setPurpose('travelling')}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm">Travelling</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="purpose"
                                        value="relocation"
                                        checked={purpose === 'relocation'}
                                        onChange={() => setPurpose('relocation')}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm">Relocation</span>
                                </label>
                            </div>
                        </div>

                        <div className="input-box relative my-6">
                            <input
                                type="text"
                                placeholder="Starting Location"
                                required
                                value={startingLocation}
                                onChange={(e) => setStartingLocation(e.target.value)}
                                className="w-full py-3 px-12 bg-[#eee] rounded-lg border-none outline-none text-base font-medium text-[#333]"
                            />
                            <MapPin className="absolute right-5 top-1/2 -translate-y-1/2 text-xl text-[#333]" />
                        </div>

                        <div className="input-box relative my-6">
                            <input
                                type="text"
                                placeholder="Workplace"
                                required
                                value={workplace}
                                onChange={(e) => setWorkplace(e.target.value)}
                                className="w-full py-3 px-12 bg-[#eee] rounded-lg border-none outline-none text-base font-medium text-[#333]"
                            />
                            <Bot className="absolute right-5 top-1/2 -translate-y-1/2 text-xl text-[#333]" />
                        </div>
                        <button type="submit" className="btn w-full h-12 bg-[#7494ec] rounded-lg text-white font-semibold shadow-md cursor-pointer">Register</button>
                        <p className="my-4 text-sm">or register with social platforms</p>
                        <div className="social-icons flex justify-center gap-2">
                            <a href="#" className="inline-flex p-2 border-2 border-[#ccc] rounded-lg text-[#333]"><Chrome /></a>
                            <a href="#" className="inline-flex p-2 border-2 border-[#ccc] rounded-lg text-[#333]"><Facebook /></a>
                            <a href="#" className="inline-flex p-2 border-2 border-[#ccc] rounded-lg text-[#333]"><Github /></a>
                            <a href="#" className="inline-flex p-2 border-2 border-[#ccc] rounded-lg text-[#333]"><Linkedin /></a>
                        </div>
                    </form>
                </div>

                <div className="toggle-box absolute w-full h-full pointer-events-none">
                    <div className="toggle-panel toggle-left absolute w-1/2 h-full flex flex-col justify-center items-center text-white z-10 pointer-events-auto transition-all duration-600 ease-in-out">
                        <h1 className="text-4xl font-bold leading-tight">Hello, Welcome!</h1>
                        <p className="mb-5">Don't have an account?</p>
                        <button className="btn register-btn w-40 h-10 bg-transparent border-2 border-white rounded-lg text-white font-semibold shadow-none cursor-pointer" onClick={handleRegisterClick}>Register</button>
                    </div>

                    <div className="toggle-panel toggle-right absolute right-0 w-1/2 h-full flex flex-col justify-center items-center text-white z-10 pointer-events-auto transition-all duration-600 ease-in-out">
                        <h1 className="text-4xl font-bold leading-tight">Welcome Back!</h1>
                        <p className="mb-5">Already have an account?</p>
                        <button className="btn login-btn w-40 h-10 bg-transparent border-2 border-white rounded-lg text-white font-semibold shadow-none cursor-pointer" onClick={handleLoginClick}>Login</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
