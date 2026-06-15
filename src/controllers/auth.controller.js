import logger from '#config/logger.js';
import { cookies } from '#utils/cookies.js';
import { jwttoken } from '#utils/jwt.js';
import { formatValidationErrors } from '#utils/format.js';
import { signUpSchema , signInSchema} from '#validations/auth.validation.js';
import { createUser, authenticateUser } from '#services/auth.service.js';

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
                name: user.name,
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

export const signIn = async (req,res,next)=>{
    try{
        const validationResult = signInSchema.safeParse(req.body);

        if(!validationResult.success){
            return res.status(400).json({
                error: 'validation failed',
                details: formatValidationErrors(validationResult.error)
            });
         }
        
         const { email, password} = validationResult.data;

         const user = await authenticateUser(email, password);

         const token = jwttoken.sign({
            id: user.id,
            email: user.email,
            role: user.role
         });

         cookies.set(res,'token',token);

         logger.info(`User signed in successfully: ${user.email}`);
         res.status(200).json({
            message: 'User signed in successfully',
            user:{
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            }
         });
        
    }catch(err){
        logger.error(`Error in signin controller: ${err.message}`);

        if(err.message === 'Invalid email or password' || err.message === 'User not found' || err.message === 'Invalid password'){
            return res.status(401).json({error: 'Invalid credentials'});
        }

        next(err);
    };
}

export const signOut = async (req,res,next)=>{
    try{

        cookies.clear(res,'token');

        logger.info('User signed out successfully');
        res.status(200).json({message: 'User signed out successfully'});

    }catch(err){
        logger.error('Sign out error' + err.message);
        next(err);
    }
}