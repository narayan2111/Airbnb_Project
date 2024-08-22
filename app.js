const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync");
const ExpressError = require("./utils/ExpressError.js")
const {ListingSchema} = require("./schema.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";


app.set("view-engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.engine('ejs',ejsMate);
app.use(express.static(path.join(__dirname,"/public")));


main()
    .then(()=>{
        console.log("connected to database");
    })
    .catch((err)=>{
        console.log(err);
    });

async function main(){
    await mongoose.connect(MONGO_URL);
}

app.get("/",(req,res)=>{
    res.redirect("/listings");
});

const validateListing = (req,res,next)=>{
    let {error} = ListingSchema.validate(req.body);
    if(error){
        let errMsg = error.details.map((el)=>el.message).join(",");
        throw new ExpressError(400,errMsg);
    }
    else
        next();
}

//index route

app.get("/listings",wrapAsync(async (req,res)=>{
      const allListings =  await Listing.find({});
   res.render("listings/index.ejs",{allListings});
}));

//create route

app.post("/listings",validateListing,wrapAsync (async (req,res,next)=>{
        const newlisting = new Listing(req.body.listing);
        await newlisting.save();
        res.redirect("/listings");
})); 


//new route

app.get("/listing/new",(req,res)=>{
    res.render("listings/new.ejs");
})


//show route

app.get("/listing/:id",validateListing,wrapAsync(async (req,res)=>{
    let {id} = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/show.ejs",{listing});
}));

//Edit Route

app.get("/listings/:id/edit", wrapAsync(async (req,res)=>{
    let {id} = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/edit.ejs",{listing});
}));

app.put("/listings/:id",wrapAsync(async (req,res)=>{
    let {id} = req.params;
    if(!id)
        prompt("Price can't be blank!");
    else
    {

        await Listing.findByIdAndUpdate(id,{...req.body.listing});
        res.redirect(`/listing/${id}`);
    }


}));

app.delete("/listings/:id",wrapAsync(async (req,res)=>{
    let {id} = req.params;
    await Listing.findByIdAndDelete(id);
    res.redirect("/listings");
}));

// app.get("/testingListing", async (req,res)=>{
//     let sampleListing =  new Listing({
//         title:"New villa",
//         description : "this villa belongs to admin",
//         image:"",
//         price:1299,
//         location:"Hills,Utrakhand",
//         country:"India",
//     });

//     await sampleListing.save();
//     console.log("sample was saved");
//     res.send("Sucessful testing");
// });

app.all("*",(req,res,next)=>{
    next(new ExpressError(404,"Page not Found"));
});

app.use((err,req,res,next)=>{
    let {statusCode = 500,message = "Some error occurred"} = err;
    res.status(statusCode).render("error.ejs",{message});
    // res.status(statusCode).send(message);
    
});

app.listen(8080, () => {
    console.log("Working");
});