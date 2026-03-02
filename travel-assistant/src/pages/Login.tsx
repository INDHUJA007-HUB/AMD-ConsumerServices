
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Mail, Facebook, Github, Linkedin, Chrome } from 'lucide-react';
import './Login.css'; // We'll create this next

const Login = () => {
    const [isActive, setIsActive] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleRegisterClick = () => {
        setIsActive(true);
    };

    const handleLoginClick = () => {
        setIsActive(false);
    };

    const handleLoginSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Simulating login - in a real app, validate credentials
        // For this task, we just need the name. 
        // If logging in without a name field, we might check localStorage or ask for it.
        // The provided HTML login form only has Username and Password.
        // We'll use the username input as the "Name" for the welcome message.
        if (name) {
            localStorage.setItem('userName', name);
            navigate('/');
        }
    };

    const handleRegisterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name) {
            localStorage.setItem('userName', name);
            navigate('/');
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
