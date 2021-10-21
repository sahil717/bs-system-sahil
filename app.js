
require("dotenv").config();
const express = require('express');
const port = process.env.PORT || 3000;
const app = express();
const path = require('path');
const boddyparser = require('body-parser');
const mongoose = require('mongoose');

app.use(boddyparser.urlencoded({ extended: true }));

mongoose.connect(process.env.DB_LINK).then(() => { console.log("connected...") }).catch((err) => { console.log(err) })


// defining Schema


const Userschema = new mongoose.Schema({
    name: String,
    mobile: String,
    email: String,
    amount: String
});

const user = mongoose.model('user', Userschema);
const transferschema = new mongoose.Schema({
    senName: String,
    recName: String,
    trsAmount: Number
});

const History = mongoose.model('transferRecord', transferschema)

// EXPRESS SPECIFIC STUF

// app.use('/static', express.static(path.join(__dirname, 'static')));
// app.use(express.urlencoded());
app.use(express.static("static"));

// PUG SPECIFIC STUF

app.set('view engine', 'pug');

// ENDPOINT

app.get('/', (req, res) => {
    res.sendFile('index.html');
});

app.get('/Addusers', (req, res) => {
    res.render('addusers.pug', { success: "", msg: "" });
});

app.get('/transfar', (req, res) => {
    const trns = History.find({});
    trns.exec((err, Data) => {
        if (err) {
            throw err
        }
        else {
            res.render('transfar.pug', { records: Data });
        }
    });
});

app.post('/Addusers', (req, res) => {
    const { name, mobile, email, amount } = req.body;
    const userdata = new user({
        name: name,
        mobile: mobile,
        email: email,
        amount: amount
    });
    userdata.save().then(() => {
        res.render('addusers.pug', { success: "Account Created Successfilly.", msg: "success" });
    }).catch(() => {
        res.render('addusers.pug', { success: "Data is Invalid", msg: "danger" });
    });
});


app.get('/Aboutus', (req, res) => {
    res.render('aboutus.pug');
});


app.get('/allusers', (req, res) => {
    const alluser = user.find({});
    alluser.exec((err, data) => {
        if (err) {
            throw err
        }
        else {
            res.render('allusers.pug', { records: data });

        }
    });
});

// all user view 

app.get('/view/:id', (req, res) => {
    const id = req.params.id;
    const sender = user.find({ "_id": id });
    const alluser = user.find({});

    sender.exec((err, data) => {
        if (err) {
            throw err;
        }
        else {
            alluser.exec((err, allData) => {
                if (err)
                    throw err
                else
                    res.render('viewUser', { records: data, alluser: allData })
            });
        }
    })
});

// for money transfer and transfer History

app.post('/transferMoney', (req, res) => {
//    get data
    let senId = req.body.senId;
    let senName = req.body.senName;
    let senEmail = req.body.senEmail;
    let senAmount = req.body.senAmount;
    let recEmail = req.body.recEmail;
    let recName = req.body.recName;
    let recAmount = req.body.recAmount;
    // console.log(recAmount)
//  checking Reciver name and Reciver Email Fields
    if (recName === 'Select User' || recEmail === 'Select Email') {
        res.render('success',{msg: "success"});
    }
// define model
    const trnsData = new History({
        senName: senName,
        recName: recName,
        trsAmount: recAmount

    })

    const recDetail = user.find({ "email": recEmail});

    recDetail.exec((err , Adata) =>{ 
      if(err) {
          throw err;
      }
      else{
        Adata.forEach((a) => {
            // console.log(a.name)
            // console.log(a.email)
            if (a.name != recName || a.email != recEmail) {
                res.render('success', {msg: "Details Not Matched"})
            } else {
                var senderData = user.find({ "_id": senId });
                var reciverData = user.find({ "name": recName, "email": recEmail });

               senderData.exec((err, Sdata) => {
                   if(err){

                       throw err
                   }
                   else{
                       reciverData.exec((err,Rdata) => {
                           if(err){
                               throw err;
                           }
                           else{
                            Sdata.forEach( async (e) => {
                                if (e.amount < senAmount) {
                                    res.render("success",{msg:"NOT PROCESS DUE TO INCORRECT INFORMATION"})
                                }
                                else{
                                    let senderUpdateAmount = parseInt(e.amount) - parseInt(recAmount);
                                    // console.log("SENDER AMOUNT: "+ senderUpdateAmount);
                                    await user.findOneAndUpdate({ "_id": senId }, { "$set": { amount: senderUpdateAmount } });
                                    
                                    trnsData.save().then((result) => {
                                    }).catch((err) => {
                                        console.log(err)
                                    });

                                    Rdata.forEach(async (e) => {
                                        let reciverUpdateAmount = parseInt(e.amount) + parseInt(recAmount);
                                        // console.log("RECIVER : "+ reciverUpdateAmount);
                                        await user.findOneAndUpdate({ "name": recName }, { "$set": { amount: reciverUpdateAmount } });
                                    })
                                    res.render('success', {msg:"Payment Completed"})
                                    

                                }
                            })
                           }
                       })
                   }
               })
            } 

        })
      }

    });

});



app.listen(port, () => {
    console.log(`sever run at http://127.0.0.1:${port}`);
});
