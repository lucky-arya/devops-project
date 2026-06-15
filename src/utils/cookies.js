export const cookies = {
    getOptions : ()=>({
        httpOnly : true,
        secure : process.env.NODE_ENV === 'production', // Set secure flag in production
        sameSite : 'strict', // Adjust as needed (e.g., 'lax' or 'none' for cross-site)
        maxAge : 15 * 60 * 1000 // 15 minutes in milliseconds
    }),

    set:(res,name,value,options)=>{
        res.cookie(name,value,{
            ...cookies.getOptions(),
            ...options
        });
    },
    clear : (res,name,options)=>{
        res.clearCookie(name,{
            ...cookies.getOptions(),
            ...options
        });
    },
    get:(req,name)=>{
        return req.cookies[name];
    }
}