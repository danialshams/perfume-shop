"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type InputHTMLAttributes } from "react";
import LuxuryNavbar from "@/components/home-sections/navbar";
import { CinematicFooter } from "@/components/home-sections/CinematicStorefront";

type RegisterForm={first_name:string;last_name:string;mobile:string;password:string;confirm_password:string;province:string;city:string;address:string;plaque:string;floor:string;unit:string;postal_code:string;phone:string};
const empty:RegisterForm={first_name:"",last_name:"",mobile:"",password:"",confirm_password:"",province:"",city:"",address:"",plaque:"",floor:"",unit:"",postal_code:"",phone:""};
const phone=/^09\d{9}$/;
const strong=/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,100}$/;
export default function AccountGuest({serviceUnavailable=false}:{serviceUnavailable?:boolean}){
 const router=useRouter();
 const [mode,setMode]=useState<"login"|"register">("login");
 const [mobile,setMobile]=useState("");
 const [password,setPassword]=useState("");
 const [form,setForm]=useState<RegisterForm>(empty);
 const [accepted,setAccepted]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [showPassword,setShowPassword]=useState(false);
 function update(key:keyof RegisterForm,value:string){setForm(prev=>({...prev,[key]:value}));setError("");}
 async function submit(event:FormEvent<HTMLFormElement>){
   event.preventDefault();if(busy)return;
   setError("");
   const registering=mode==="register";
   if(registering){
     if(!phone.test(form.mobile)){setError("شماره همراه معتبر نیست.");return;}
     if(!strong.test(form.password)){setError("رمز عبور باید حداقل ۸ کاراکتر شامل حروف کوچک و بزرگ انگلیسی، عدد و نماد داشته باشد.");return;}
     if(form.password!==form.confirm_password){setError("تکرار رمز عبور یکسان نیست.");return;}
     if(!accepted){setError("تأیید قوانین و مقررات الزامی است.");return;}
     if(form.address.trim().length<10 || !form.plaque.trim()){setError("نشانی کامل و پلاک را وارد کنید.");return;}
   }else if(!phone.test(mobile)||!password){
     setError("شماره همراه و رمز عبور معتبر وارد کنید.");return;
   }
   setBusy(true);
   try{
     const endpoint=registering?"/api/v1/customers/auth/register":"/api/v1/customers/auth/login";
     const payload=registering?form:{mobile,password};
     const response=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify(payload)});
     const result: {success?:boolean;message?:string;errors?:Array<{message?:string}>}=await response.json();
     if(!response.ok||result.success===false){
       const message=response.status===503?"ارتباط با سرویس حساب کاربری برقرار نیست.":result.errors?.[0]?.message||result.message||"انجام عملیات ممکن نشد.";
       throw new Error(message);
     }
     router.refresh();
   }catch(err){setError(err instanceof Error?err.message:"درخواست انجام نشد.");}
   finally{setBusy(false);}
 }
 const input=(key:keyof RegisterForm,label:string,props:InputHTMLAttributes<HTMLInputElement>={})=><label className="fertini-account-gateway__field" key={key}>
   <span>{label}</span><input value={form[key]} onChange={event=>update(key,event.target.value)} id={"register-"+key} name={key} {...props}/></label>;
 return <div className="fertini-account-gateway">
  <LuxuryNavbar/>
  <main className="fertini-account-gateway__layout" id="main-content">
    <figure className="fertini-account-gateway__picture">
      <Image fill priority src="/maison/portrait.jpg" sizes="(min-width:900px) 48vw, 100vw" alt="فضای آرام و هنری رایحه‌های فرتینی"/>
      <figcaption lang="en" dir="ltr">FERTINI / A PERSONAL SIGNATURE</figcaption>
    </figure>
    <section className="fertini-account-gateway__body" dir="rtl">
      <span className="maison-kicker" lang="en" dir="ltr">FERTINI / MY ACCOUNT</span>
      <h1>حساب شخصی<br/><em>شما.</em></h1>
      <p className="fertini-account-gateway__intro">ورود به حساب، پیگیری سفارش‌ها و مدیریت اطلاعات شخصی در یک مکان.</p>
      {serviceUnavailable&&<p className="fertini-account-gateway__service" role="status">اطلاعات حساب قبلی فعلاً در دسترس نیست؛ در صورت نیاز دوباره وارد شوید.</p>}
      <div className="fertini-account-gateway__tabs" role="group" aria-label="انتخاب ورود یا ثبت‌نام">
        <button type="button" className={mode==="login"?"is-active":""} aria-pressed={mode==="login"} onClick={()=>{setMode("login");setError("");}}>ورود</button>
        <button type="button" className={mode==="register"?"is-active":""} aria-pressed={mode==="register"} onClick={()=>{setMode("register");setError("");}}>ایجاد حساب</button>
      </div>
      <form onSubmit={event=>void submit(event)} className="fertini-account-gateway__form">
        {mode==="login"?<>
          <label className="fertini-account-gateway__field"><span>شماره همراه</span><input type="tel" inputMode="numeric" required autoComplete="tel" dir="ltr" placeholder="09123456789" maxLength={11}
            value={mobile} onChange={event=>setMobile(event.target.value.replace(/\D/g,"").slice(0,11))}/></label>
          <label className="fertini-account-gateway__field"><span>رمز عبور</span><input type={showPassword?"text":"password"} required autoComplete="current-password" value={password} onChange={event=>setPassword(event.target.value)}/></label>
          <button className="fertini-account-gateway__toggle" type="button" onClick={()=>setShowPassword(value=>!value)}>{showPassword?"پنهان‌کردن رمز":"نمایش رمز"}</button>
        </>:<>
          <div className="fertini-account-gateway__pair">{input("first_name","نام",{required:true,minLength:2,autoComplete:"given-name"})}{input("last_name","نام خانوادگی",{required:true,minLength:2,autoComplete:"family-name"})}</div>
          {input("mobile","شماره همراه",{type:"tel",inputMode:"numeric",required:true,maxLength:11,autoComplete:"tel",dir:"ltr"})}
          <div className="fertini-account-gateway__pair">{input("password","رمز عبور",{type:"password",required:true,autoComplete:"new-password",minLength:8})}{input("confirm_password","تکرار رمز عبور",{type:"password",required:true,autoComplete:"new-password",minLength:8})}</div>
          <p className="fertini-account-gateway__hint">رمز: حداقل ۸ کاراکتر شامل حروف کوچک و بزرگ انگلیسی، عدد و نماد.</p>
          <div className="fertini-account-gateway__pair">{input("province","استان",{required:true,minLength:2})}{input("city","شهر",{required:true,minLength:2})}</div>
          {input("address","نشانی کامل",{required:true,minLength:10,autoComplete:"street-address"})}
          <div className="fertini-account-gateway__pair">{input("plaque","پلاک",{required:true})}{input("unit","واحد (اختیاری)")}</div>
          <div className="fertini-account-gateway__pair">{input("floor","طبقه (اختیاری)")}{input("postal_code","کد پستی (اختیاری)",{inputMode:"numeric"})}</div>
          {input("phone","تلفن ثابت (اختیاری)",{inputMode:"numeric"})}
          <label className="fertini-account-gateway__terms"><input type="checkbox" checked={accepted} onChange={event=>setAccepted(event.target.checked)}/>
            <span><Link href="/terms" target="_blank">قوانین و مقررات</Link> و <Link href="/privacy" target="_blank">حریم خصوصی</Link> را مطالعه کرده‌ام.</span></label>
        </>}
        {error&&<p role="alert" className="fertini-account-gateway__error">{error}</p>}
        <button className="fertini-account-gateway__submit" type="submit" disabled={busy||(mode==="register"&&!accepted)}>{busy?"در حال بررسی…":mode==="login"?"ورود به حساب":"ایجاد حساب +"}</button>
      </form>
    </section>
  </main>
  <CinematicFooter/>
 </div>;
}
