import aj from  "#config/arcjet.js";
import logger from "#config/logger.js";
import { slidingWindow } from "@arcjet/node";


const secutityMiddleware = (async (req, res, next)=>{
    try{


        const role = req.user ? req.user.role : 'guest';

        let limit;
        let message;

        switch(role){
            case 'admin':
                limit = 20;
                message = "Admin rate limit exceeded(20 per minute). slow down.";
                break;
            case 'user':
                limit = 10;
                message = "User rate limit exceeded(10 per minute). Please try again later.";
                break;
            case 'guest':
                limit =5;
                message = "Guest rate limit exceeded(5 per minute). Please try again later.";
                break;
            default:
                limit = 5;
                message = "Rate limit exceeded. Please try again later.";
        }

        const client = aj.withRule(
            slidingWindow({
                mode: 'LIVE',
                interval: '1m', // 1 minute
                max : limit, // Max requests per minute based on role
                name : `Rate limit for ${role}`,
            })
        );

        const decision  = await client.protect(req);
        
        if(decision.isDenied() && decision.reason.isBot()){
            logger.warn('Bot request blocked', { ip: req.ip , userAgent: req.get('User-Agent'),path: req.path });
            res.status(403).json({error : 'Forbidden' , message : "Bot traffic is not allowed"});
        }
        
        if(decision.isDenied() && decision.reason.isShield()){
            logger.warn('Shield request blocked', { ip: req.ip , userAgent: req.get('User-Agent'),path: req.path , method: req.method});
            res.status(403).json({error : 'Forbidden' , message : "Shield traffic is not allowed"});
        }

        if(decision.isDenied() && decision.reason.isRateLimit()){
            logger.warn('Rate limit exceeded', { ip: req.ip , userAgent: req.get('User-Agent'),path: req.path , method: req.method, role, limit });
            res.status(429).json({error : 'Too Many Requests' , message : message});
        }

        next();

    }catch(Err){
        console.error("Security Middleware Error:", Err);
        res.status(500).json({error : 'Internal Server Error' , message : "Something went wrong in security middleware"});
    }
})

export default secutityMiddleware;