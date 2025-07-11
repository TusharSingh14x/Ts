import express from "express";
import cors from "cors";
import{z} from 'zod';
import dotenv from "dotenv";
dotenv.config(); 
const JWT_PASSWORD=process.env.JWT_PASSWORD;
if (!JWT_PASSWORD) {
  throw new Error("JWT_PASSWORD is not defined in environment variables");
}
import  { ContentModel, LinkModel, UserModel } from './db';
import jwt from "jsonwebtoken"; 
const app=express();


app.use(express.json());
// const userSchema=z.object({
//     name:z.string().min(3).max(10),
//     password:z.string().regex(
//         /^(?=.*[a-z])(?=.*[A-Z]).*$/,
//         'Must contain at least one lowercase and one uppercase letter.'
//       ),
// });

app.use(cors());

import { Request, Response } from 'express';
import { middleware } from "./middleware";
import { random } from "./util";

app.post("/api/signup", async function (req: Request, res: Response) {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(411).json({ msg: "Inputs required" });
    return;
  }

  try {
    const newUser = await UserModel.create({
      username: username,
      password: password,
    });
    res.status(200).json({ msg: `Created user with name ${newUser.username}` });
    return;
  } catch (error) {
    res.status(500).json({ msg: "User already exists or DB error" });
    return;
  }
});




app.post("/api/signin",async function(req,res){
    const {username,password}=req.body;
    if (!username||!password) {
         res.status(401).json({msg:"Enter the name and password both"});
         return;
    }
try {
    const user=await UserModel.findOne({
        username:username,
    })
    if (!user|| user.password!==password) {
        res.status(401).json({msg:"NOt found"});
        return;
    }   

        const token=jwt.sign({userId:user._id,username:user.username},JWT_PASSWORD);
        
        res.status(201).json({token});
    
} catch (error) {
     res.status(500).json("User is not found");
     return;
}
})

app.post("/api/content",middleware,async (req:Request,res:Response)=>{
const link =req.body.link;
const type=req.body.type;
await ContentModel.create({
link,
type,
title:req.body.title,
//@ts-ignore
userId:req.userId,

tags:[]
})
res.status(200).json({msg:"the comment is beign created sucessfully"});
return;
})

app.get("/api/content",middleware,async(req,res)=>{
//@ts-ignore
  const userId=req.userId;
const content=await ContentModel.find({
  userId:userId
}).populate("userId","username");
res.json({
  content
})
return;
})

app.delete("/api/content",middleware,async(req:Request,res:Response)=>{
const contentId=req.body.contentId;
await ContentModel.deleteOne({
contentId,
//@ts-ignore
userId:req.userId
});
res.json({
 msg: "Deleted"
})
return;
})

app.post("/api/brain/share", middleware, async (req, res) => {
    const share = req.body.share;
    if (share) {
            const existingLink = await LinkModel.findOne({
              //@ts-ignore  
              userId: req.userId
            });

            if (existingLink) {
                res.json({
                    hash: existingLink.hash
                })
                return;
            }
            const hash = random(10);
            await LinkModel.create({
              //@ts-ignore
                userId: req.userId,
                hash: hash
            })

            res.json({
                hash
            })
    } else {
        await LinkModel.deleteOne({
          //@ts-ignore
            userId: req.userId
        });

        res.json({
            message: "Removed link"
        })
    }
})

app.get("/api/brain/:shareLink", async (req, res) => {
    const hash = req.params.shareLink;

    const link = await LinkModel.findOne({
        hash
    });

    if (!link) {
        res.status(411).json({
            message: "Sorry incorrect input"
        })
        return;
    }
    // userId
    const content = await ContentModel.find({
        userId: link.userId
    })

    console.log(link);
    const user = await UserModel.findOne({
        _id: link.userId
    })

    if (!user) {
        res.status(411).json({
            message: "user not found, error should ideally not happen"
        })
        return;
    }

    res.json({
        username: user.username,
        content: content
    })

})


app.listen(8000);