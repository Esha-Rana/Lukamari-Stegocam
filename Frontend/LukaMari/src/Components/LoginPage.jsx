import { useState } from "react";
import "../index.css";
import { Link,Route,Routes } from 'react-router-dom';
import ForgotPassword from "./ForgotPass";
export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = { email: "", password: "" };
    let isValid = true;

    if (!formData.email) {
      newErrors.email = "Email is required.";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Enter a valid email address.";
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = "Password is required.";
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    // ✅ Ready to call your API here
    console.log("Logging in with:", formData);
  };

  return (
    <div className="flex flex-col justify-center items-center w-3/4 min-h-screen "> 
    <div className="flex items-start fixed top-10 left-16">
    <h3 className="text-white tracking-widest font-extralight text-2xl">luka</h3>
    <h2 className="text-blue-400 tracking-widest font-semibold text-2xl" >MARI</h2>
    </div>
      <div className="flex flex-col w-3/4 bg-black gap-1 rounded-2xl p-6">
        <h2 className="font-light flex tracking-wide text-white">Welcome Back!</h2>
        <h3 className="font-extralight flex text-white">Sign in to your account</h3>

        <div className="mt-3 flex flex-col gap-5">
          <form onSubmit={handleSubmit}>
            <div>
              <label className="flex flex-col items-start ml-3 gap-2 text-white placeholder:text-gray-400">
                Email Address
                <input
                  type="email"
                  name="email"
                  placeholder="abc@gmail.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="border-2 border-gray-400 p-1.5 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-700 w-full flex bg-gray-900"
                />
              </label>
              {errors.email && (
                <p className="text-red-400 text-sm ml-3 mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="flex items-start mt-2 ml-3 flex-col gap-2 text-white placeholder:text-gray-400">
                Password
                <input
                  type="password"
                  name="password"
                  placeholder="********"
                  value={formData.password}
                  onChange={handleChange}
                  className="border-2 border-gray-400 p-1.5 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-700 w-full flex bg-gray-800"
                />
              </label>
              {errors.password && (
                <p className="text-red-400 text-sm ml-3 mt-1">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              className="border-xl rounded-xl w-full mt-7 ml-2 bg-blue-700 hover:bg-blue-900 p-2 transition delay-50 text-white"
            >
              Log In
            </button>
          </form>
        </div>

        <div className="flex justify-between mt-2">
          <div className="flex justify-start">
            <h4 className="text-white ml-3 font-extralight">Don't have an Account,</h4>
            <h4 className="text-blue-400 ml-1 font-semibold">Create One.</h4>
          </div>
          <div className="flex justify-end items-end mr-3">
            <Link to='/forgotpass' className="text-blue-400 font-semibold">
              Forgot Your Password?
            </Link>
            </div>
        </div>
      </div>
    
      <p className="text-gray-400 mt-3 flex "> Or sign in with</p>
  
      <div className=" mt-3 rouned flex w-3/4 justify-around">
        <button type="button" className='text-white border bg-gray-900 p-3 rounded-xl hover:bg-blue-700 transition delay-45 w-49/100 border-gray-400'>Google</button>
        <button type="button" className='text-white border bg-gray-900 p-3 rounded-xl hover:bg-blue-700 transition delay-45 w-49/100 border-gray-400'>Github</button>
      </div>
      <Routes>
        <Route path="/forgotpass" element={<ForgotPassword/>}></Route>
      </Routes>
    </div>
  );
}