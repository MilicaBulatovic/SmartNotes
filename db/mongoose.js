const mongoose =require('mongoose');

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://127.0.0.1:27017/SmartNotes' , {useNewUrlParser: true}).then(() =>{
    console.log("Connected to db");
}).catch((e) => {
    console.log("Error while connecting");
    console.log(e);
});

module.exports = {
    mongoose
}