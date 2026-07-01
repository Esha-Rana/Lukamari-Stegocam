import '../index.css'
import LoginPage from './LoginPage';
import { Link,Route,Routes } from 'react-router-dom';
import { supabase } from '../../Supabase-client';

export default function ForgotPassword(){
const [email,setEmail]=("");
  
function handleChange(e){
   setEmail(e.target.value);
   validate();
  }

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter a valid email address.";
  }
  async function buttonClicked(){
    const {error}= await supabase.auth.resetPasswordForEmail(email);
  }

return (
    <div className='min-h-screen w-full flex justify-center items-center'>
      <div className='w-fit bg-gray-900 flex flex-col rounded-xl p-6'>
       <div className='flex'>

         <h2 className='text-white tracking-widest text-xl'>luka</h2>
         <h1 className='text-blue-400 tracking-widest text-xl'>MARI</h1>

        </div>
        <div className='flex flex-col justify-center items-center' >

        <h1 className='text-white mt-5 text-2xl font-semibold tracking-wider'>Forgot Password.</h1>
       
        <div className='flex flex-col '>

         <h3 className='text-gray-400 '>Enter your email to get a password recieve link.</h3>
          <div className='flex flex-col mt-4'>

            <h3 className='text-white tracking-wider font-extralight'> E-Mail </h3>
             <input type='email' className='border-xl border-2 border-gray-400 rounded-xl placeholder:text-gray-400 p-2' placeholder='Enter your email.
             ' onchange={handleChange()}
             >
             </input>

           <button type='submit' className='text-white tracking-wider bg-gray-500 mt-6 rounded-lg hover:bg-gray-400 focus:ring-2 focus:ring-blue-400'>Send Link.</button>
          
            <div className='flex justify-center items-center'>
                <Link to= '/'className='text-white font-extralight mt-3 tracking-wider'>Back to Login.</Link>
            </div> 
            
          </div>
        </div> 
       </div> 
      </div>

     

    </div>
);
}