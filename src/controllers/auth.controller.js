import logger from '#config/logger.js';
import { cookies } from '#utils/cookies.js';
import { jwttoken } from '#utils/jwt.js';
import { formatValidationErrors } from '#utils/format.js';
import { signUpSchema } from '#validations/auth.validation.js';
import { createUser } from '#services/auth.service.js';

export const signup = async (req,res,next)=>{
    try{

        const validationResult = signUpSchema.safeParse(req.body);

        if(!validationResult.success){
            const errorMessage = formatValidationErrors(validationResult.error);
            return res.status(400).json({error: errorMessage});
        }

        const { username, email, password, role } = validationResult.data;

        // Auth service 

        const user = await createUser({username, email, password, role});

        const token = jwttoken.sign({id: user.id, email: user.email, role: user.role});

        cookies.set(res,'token',token)

        logger.info(`User signed up with email: ${user.email}`);
        res.status(201).json({message: 'User registered',
            user : {
                id : user.id,  
                username: user.username,
                email: user.email,
                role: user.role
            }
        });

        

    }catch(err){
        logger.error(`Error in signup controller: ${err.message}`);
        if(err.message === 'user with this email already exists'){
            return res.status(409).json({error: 'Email already exists'});
        }
        next(err);
    }
}