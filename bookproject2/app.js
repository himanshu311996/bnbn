var express = require('express');
var url = require('url');
var bp = require('body-parser');
var mysql = require('mysql');
// var formidable = require('formidable');
var session = require('express-session');
var path = require('path');
var fs = require('fs-extra');
var mkdirp = require('mkdirp');
var fileUpload = require('express-fileupload');
var connectFlash = require('connect-flash');
var app = express();

var con = mysql.createConnection({
    host : 'localhost',
    user : 'root',
    password : '',
    database : 'bookhub'
});

app.use(fileUpload());
app.use(require('connect-flash')());
app.use((req,res,next)=>{ 
    res.locals.messages = require('express-messages') (req,res);
    next();
 });
app.set('view engine','ejs');
app.use(express.static(__dirname + '/public'));
app.use(bp.urlencoded({extended : true}));
app.use(session({ secret : 'abc'}));
app.get('*',(req,res,next)=>{
    res.locals.username = req.session.email;
    res.locals.admin = req.session.admin;
    res.locals.cart = req.session.cart;
    res.locals.comment = req.session.comment;
    next();
});
app.get('/',(req,res)=>
{
    var q = "select * from books";
    con.query(q,(err,result)=>{
        console.log(result);
        if(err)
        {
            console.log('Error in Fetching the images from tha database');
            console.log(err);
        }
        else{
            var p = "select name from category";
            con.query(p,(err1,result1)=>{
                if(err1)
                {
                    throw err1;
                }
                else{
                    console.log("result is ");
                    console.log(result);
                    console.log(result1);
                 res.render('root.ejs',{ data : result,category : result1});           
                    
                }
            });
        }
    });
});
/******************** Admin View ***************/
// app.get('/adminview',(req,res)=>
// {
//     res.render('admin-form.ejs');
// });

app.post('/submitadminform',(req,res)=>
{
    var _email = req.body.email;
    var _password = req.body.password;
    console.log(_email);
    console.log(_password);
    var q = "select count(email) as nor from admin where email = '"+_email+"' and password = '"+_password+"' and status = 'Active'";
    con.query(q,(err,result)=>
    {
        if(err)
            throw err;
        else
        {
            if(result[0].nor == 1)
            {

                req.session.email = _email;
                if(!req.session.email)
                {
                    res.redirect('/');
                    //console.log('inside if');
                }
                else
                {
                    res.redirect('/admindashboard');
                }
            }
            else
            {
                res.redirect('/');
            }
        }
    });
});

app.get('/addcategory',(req,res)=>
{
    res.header('cache-control','no-cache,private,no-store,must-revalidate,max-stale=0,post-check=0,pre-check=0');
    if(!req.session.email)
    {
        res.redirect('/');
    }
    else{
        var q = "select name from category";
        con.query(q,(err,result)=>{
            if(err)
            throw err;
    res.render('addcat.ejs',{data:req.session.email,category:result});
            
        });
    }
});
app.post('/submitcat',(req,res)=>
{
    var _name = req.body.name;
    console.log(_name);
    var q = "insert into category set name = '"+_name+"'";
    con.query(q,(err,result)=>
    {
        if(err)
            throw err;
        else{
            console.log('Category Inserted');
            res.redirect('/addcategory');
        }
    });
});
app.get('/viewcat',(req,res)=>
{
    res.header('cache-control','no-cache,private,no-store,must-revalidate,max-stale=0,post-check=0,pre-check=0');
    if(!req.session.email)
    {
        res.redirect('/');
    }
    else
    {
    var q = "select * from category";
    con.query(q,(err,result)=>
    {
        if(err)
            throw err;
        else
        {
            var p = "select name from category";
            con.query(p,(err1,result1)=>{
                if(err1)
                throw err1;
            res.render('viewcat.ejs',{ data:req.session.email ,output : result,category : result1 });
                
            });
        }
    });
     }
});
app.get('/deletecat/:id',(req,res)=>
{
    var _id = req.params.id;
    var p = "delete from category where id = '"+_id+"'";
    con.query(p,(err,result)=>
    {
        if(err)
            throw err;
        else
        {
            res.redirect('/viewcat');
        }
    });
});
app.get('/updatecat/:id',(req,res)=>
{
    var _id = req.params.id;
    var q = "select * from category where id = '"+_id+"'";
    con.query(q,(err,result)=>
    {
        if(err)
            throw err;
        else
        {
            var p = "select name from category";
            con.query(p,(err1,result1)=>{
                if(err1)
                throw err1;
            res.render('updatecategory.ejs',{ data:req.session.email,out : result,category:result1 });
                
            });
        }
    });
});

app.post('/submitupdate/:id',(req,res)=>
{
    var _id = req.params.id;
    var _name = req.body.name;
    var p = "update category set name = '"+_name+"' where id = '"+_id+"'";
    con.query(p,(err,result)=>
    {
        if(err)
            throw err;
        else
        {
            res.redirect('/viewcat');
        }
    });
});
app.get('/admindashboard',(req,res)=>
{ 
    res.header('cache-control','no-cache,private,no-store,must-revalidate,max-stale=0,post-check=0,pre-check=0');
    if(!req.session.email)
    {
        res.redirect('/');
    }
    else{
    res.render("login-admin.ejs",{data:req.session.email});
     }
});
app.get('/addbooks',(req,res)=>
{
    res.header('cache-control','no-cache,private,no-store,must-revalidate,max-stale=0,post-check=0,pre-check=0');
    if(!req.session.email)
    {
        res.redirect('/');
    }
    else
    {
    var u = "select name from category";
    con.query(u,(err,result)=>
    {
        console.log(result);
        if(err)
            throw err;
        var p ="select name from category";
        con.query(p,(err1,result1)=>{
            if(err1)
            throw err1;
            res.render('addbook.ejs',{ data:req.session.email,output : result,category : result1});

        });
    });
     }
});

app.post('/add',(req,res)=>
{
    res.header('cache-control','no-cache,private,no-store,must-revalidate,max-stale=0,post-check=0,pre-check=0');
    if(!req.session.email)
    {
        res.redirect('/');
    }
    else
    {
             var _category = req.body.category;
             var _title = req.body.title;
             var _language = req.body.language;
             var _author = req.body.author;
             var _publisher = req.body.publisher;
             var _description = req.body.description;
             var _edition = req.body.edition;
             var _oprice = req.body.oprice;
             var _sprice = req.body.sprice;
             var _quan = req.body.quan;
             console.log("filetoupload is ");
             console.log(req.files.filetoupload);
             var imageFile = typeof req.files.filetoupload !='undefined' ? req.files.filetoupload.name : ' ';
             console.log(imageFile);
             console.log(_title.length);
            if(_title.length == 0 ) {
                console.log("Enter");
                req.flash('danger','Title is Required');
                res.redirect('back');
                return;
            }
             if(_language.length == 0 ) {
                console.log("Enter");
                req.flash('danger','Language is Required');
                res.redirect('back');
                return;
            }
            if(_author.length == 0 ) {
                console.log("Enter");
                req.flash('danger','Author is Required');
                res.redirect('back');
                return;
            }
            if(_publisher.length == 0 ) {
                console.log("Enter");
                req.flash('danger','Publisher is Required');
                res.redirect('back');
                return;
            }
            if(_description.length == 0 ) {
                req.flash('danger','Description is Required');
                res.redirect('back');
                return;
            }
            if(_edition.length == 0 ) {
                req.flash('danger','Edition is Required');
                res.redirect('back');
                return;
            }
            if(_oprice.length == 0 ) {
                req.flash('danger','Original Price is Required');
                res.redirect('back');
                return;
            }
            if(_sprice.length == 0 ) {
                req.flash('danger','Sale Price is Required');
                res.redirect('back');
                return;
            }
            if(_language.length == 0 ) {
                req.flash('danger','Language is Required');
                res.redirect('back');
                return;
            }
             var q = "insert into books set category = '"+_category+"',title='"+_title+"',language='"+_language+"',author='"+_author+"',publisher='"+_publisher+"',description='"+_description+"',edition='"+_edition+"',original_price='"+_oprice+"',sale_price='"+_sprice+"',image='"+imageFile+"',quantity = '"+_quan+"'";
             console.log(q);
             con.query(q,(err,result)=>{
                 if(err)
                 {
                     console.log('error in insertion');
                     console.log(err);
                 }
                 else{
                     var p = "select id as id from books where title = '"+_title+"';"
                     console.log(p);
                     con.query(p,(err,result)=>{
                         console.log(result);
                        if(!err)
                        {
                            console.log("id fetched");
                            console.log(result[0].id);
                            
                            var oldpath = req.files.filetoupload;
                            var newpath = 'public/bookimages/'+imageFile;
                            oldpath.mv(newpath,(err)=>{
                                if(err)
                                {
                                    console.log('Error in move file');
                                    console.log(err);
                                }
                            
                            });
                        }
                        else{
                            console.log("error in getting id "  ) ;
                        }
                     });
                 res.redirect('/viewbooks');
                }
             });
        
    //
        // form.parse(req, function (err, fields, files) {
        //     var _category = req.body.category;
        //     var _title = req.body.title;
        //     var _language = req.body.language;
        //     var _author = req.body.author;
        //     var _publisher = req.body.publisher;
        //     var _description = req.body.description;
        //     var _edition = req.body.edition;
        //     var _oprice = req.body.oprice;
        //     var _sprice = req.body.sprice;
            
        //     // console.log(_category);        
        //     // console.log(_title);
        //     // console.log(_language);
        //     // console.log(_author);
        //     // console.log(_publisher);
        //     // console.log(_description);        
        //     // console.log(_sprice);
        //     // console.log(_oprice);
            
        
        //     var oldpath = files.filetoupload.path;
        //     console.log(oldpath);
        //     var newpath = 'C:/Users/Vicky/Desktop/node/express/bookproject/public/images/' + files.filetoupload.name;
            
        //     fs.rename(oldpath, newpath, function (err) {
        //       if (err) throw err;
        //       console.log('File uploaded and moved!');
            
        // var q="insert into books set category='"+_category+"',title = '"+_title+"',language = '"+_language+"',author = '"+_author+"',publisher='"+_publisher+"',description = '"+_description+"',edition='"+_edition+"',original_price='"+_oprice+"',sale_price='"+_sprice+"',image = '"+files.filetoupload.name+"' ";
        // con.query(q,(err1,result1)=>
        // {
        //     if(err1)
        //         throw err1;
        //     else{
        //         res.redirect('/addbooks');
        //         console.log('Inserted');
        //     }
        // });
        //     });
        // });
 }
});

app.get('/viewbooks',(req,res)=>
{
    res.header('cache-control','no-cache,private,no-store,must-revalidate,max-stale=0,post-check=0,pre-check=0');
    if(!req.session.email)
    {
        res.redirect('/');
    }
    else{
    var p = "select * from books";
    con.query(p,(err,result)=>
    {
        output = result;
      //  console.log(output);
        if(err)
            throw err;
        else{
            var q="select name from category";
            con.query(q,(err1,result1)=>{
                if(err1)
                throw err1;
                console.log('Data Fetch Successfully');
                res.render('viewbook.ejs', { data:req.session.email,output : result,category : result1});
            });

        }
    });
 }
});

app.get('/single/:id/:image',(req,res)=>
{
    console.log("in delete singlw");
    var _id = req.params.id;
    var p = 'public/bookimages/'+req.params.image;
    fs.remove(p,(err)=>{
        if(!err)
        {
            console.log("moved image");
            var l = "delete from books where id = '"+_id+"'";
            con.query(l,(err,result)=>
            {
                if(err)
                    throw err;
                else{
                    console.log("remoived book");
                    req.flash("success","Book deleted");
                    res.redirect('back');
                }
            });
        }
        else{
            console.log(err);
        }
    });
    

});
app.get('/updatebook/:id',(req,res)=>
{
    var _id = req.params.id;
    var p = "select * from books where id = '"+_id+"'";
    con.query(p,(err,result)=>
    {
        if(err)
            throw err;
        else
        {
            var q = "select name from category";
            con.query(q,(err1,result1)=>
            {
                if(err1)
                    throw err1;
                    res.render('updatebooks.ejs',{ data:req.session.email,out : result,category : result1});
            });
            
        }
    });
   
});
app.post('/submitupdatebook/:id',(req,res)=>
{
        var _id = req.params.id;
        var _category = req.body.category;
        var _title = req.body.title;
        var _language = req.body.language;
        var _author = req.body.author;
        var _publisher = req.body.publisher;
        var _description = req.body.description;
        var _edition = req.body.edition;
        var _oprice = req.body.oprice;
        var _sprice = req.body.sprice;
        var imageFile = typeof req.files.filetoupload != 'undefined' ? req.files.filetoupload.name : '';
        var _Pimage = req.body.Pimage;
        console.log('Old image is:'+_Pimage);


        if(imageFile == '')
        {
            imageFile = _Pimage;

        }
        else
        {
            if(_Pimage != '')
            {
                console.log('If _Pimage Not Empty Run Successfull');
                fs.remove('public/bookimages/'+_Pimage,(err)=>{
                    if(err)
                    {
                        console.log('Error in Removing Image');
                        console.log(err);
                        return;

                    }

                });
            }

            oldpath = req.files.filetoupload;
            console.log('Old Path is : ' + oldpath);
            newpath = 'public/bookimages/'+imageFile;
            console.log('New Path is : '+newpath);

            oldpath.mv(newpath,(err)=>{
                if(err)
                {
                    console.log('Error in New Path when replacing with old path');
                    console.log(err);
                    return;
                }
            })
        }
        console.log(imageFile);
        
        
        // console.log(_category);        
        // console.log(_title);
        // console.log(_language);
        // console.log(_author);
        // console.log(_publisher);
        // console.log(_description);        
        // console.log(_sprice);
        // console.log(_oprice);
        
          
    var q="update books set category='"+_category+"',title = '"+_title+"',language = '"+_language+"',author = '"+_author+"',publisher='"+_publisher+"',description = '"+_description+"',edition='"+_edition+"',original_price='"+_oprice+"',sale_price='"+_sprice+"',image = '"+imageFile+"' where id = '"+_id+"' ";
    con.query(q,(err1,result1)=>
    {
        console.log(result1);
        if(err1)
            throw err1;
        else{
            res.redirect('/viewbooks');
            console.log('Inserted');
        }
    });

});



app.post('/deletechecks',(req,res)=>
{
    var ch = req.body.check;
    console.log(ch);
     for(var i=0 ;i<ch.length;i++)
     { 
            var q = "delete from books where id = '"+ch[i]+"'";
            con.query(q,(err,result)=>
            {
                if(err)
                    throw err;
               
            });
     } 
     req.flash("success","Books deleted successfully");
     res.redirect('back');

});
app.get('/viewuser',(req,res)=>
{
    res.header('cache-control','no-cache,private,no-store,must-revalidate,max-stale=0,post-check=0,pre-check=0');
    if(!req.session.email)
    {
        res.redirect('/');
    }
    else{
    var q = "select * from user";
    con.query(q,(err,result)=>
    {
        if(err)
            throw err;
        var p = "select name from category";
        con.query(p,(err1,result1)=>{
            if(err1)
            throw err1;
        res.render('viewusers.ejs',{ data:req.session.email ,users : result , category:result1 });
        });
    });
     }
});
app.get('/deleteuser/:email',(req,res)=>
{
    var _email  = req.params.email;
    //console.log(_email);
    var q = "delete from user where email = '"+_email+"'";
    con.query(q,(err,result)=>
    {
        if(err)
            throw err;
        res.redirect('/viewuser');
    });
});
app.post('/deletecheckusers',(req,res)=>
{
    var ch = req.body.check;
    console.log(ch);

     for(var i=0 ;i<ch.length;i++)
     { 
            var q = "delete from user where email = '"+ch[i]+"'";
            con.query(q,(err,result)=>
            {
                if(err)
                    throw err;
               
            });
     } 
     res.redirect('/viewuser');

});

app.get('/logout',(req,res)=>
{
    res.header('cache-control','no-cache,private,no-store,must-revalidate,max-stale=0,post-check=0,pre-check=0');
    if(!req.session.email)
    {
        res.redirect('/');
    }
    else{

    req.session.destroy();
    res.redirect('/');
     }
});
app.get('/changepass',(req,res)=>
{
    var q = "select * from category";
    con.query(q,(err,result)=>{
        if(err)
        {
            console.log('Error in fetching the category');
            console.log(err);
        }
        else{
        res.render('changepas.ejs',{category : result});
            
        }
    });
});

app.post('/submitchangepass',(req,res)=>{
    var op = req.body.oldpassword;
    var np = req.body.newpassword;
    var rnp = req.body.retypepassword;
    console.log('Old Password:',op);
    console.log('New Password:',np);
    console.log('Retype Password:',rnp); 
    var q = "select password from user where email = '"+req.session.email+"'";
    con.query(q,(err,result)=>{
        if(err){
            console.log('Error in fetching the password from user database');
            console.log(err);
        }
        console.log('Check');
        console.log(result)
        if(result[0].password === op){
            console.log('Match Successfull');
            if(np === rnp)
            {
                var p = "update user set password = '"+rnp+"' where email = '"+req.session.email+"'";
                con.query(p,(err1,result1)=>{
                    if(err1){
                        console.log('Error in Inserting New Password In Database');
                        console.log(err1);
                    }
                    else{
                        req.flash('success','Password Change Successfully');
                        res.redirect('back');
                    }
                });
            }
            else{
            req.flash('danger','Password Does Not Match');
            res.redirect('back');                
            }
        }
        else{
            req.flash('danger','Wrong Old Password');
            res.redirect('back');
        }
    });
});
/********************User View***********************/

// app.get('/userview',(req,res)=>
// {
//     res.render('signup.ejs');
// });

// app.get('/usersignupform',(req,res)=>
// {
//     res.render("signup.ejs");
// });

// app.get('/userloginform',(req,res)=>
// {
//     res.render("login.ejs");
// });

app.post('/submitsignupform',(req,res)=>
{
    var _email = req.body.email;
    var _username = req.body.username;
    var _password = req.body.password;
    console.log(_email);
    console.log(_username);
    console.log(_password);
    var p = "insert into user set email = '"+_email+"' , username = '"+_username+"' , password = '"+_password+"'";
    con.query(p,(err,result)=>
    {
        if(err)
            throw err;
        else
        {
            console.log("connectionSuccessfull");
            res.redirect('/');
        }
    });
    
});

app.post('/submitloginform',(req,res)=>
{
    console.log("in submit login");
    var _email = req.body.email;
    // var _username = req.body.username;
    var _password = req.body.password;
    console.log(_email);
    // console.log(_username);
    console.log(_password);
    var q = "select count(email) as nor from user where email = '"+_email+"' and password ='"+_password+"'";
    console.log("query is " + q);
    con.query(q,(err,result)=>
    {
        if(err){
            console.log("error");
            console.log(err);
        }
        else
        {
            console.log("success");
            if(result[0].nor == 1)
            {
                var p ="select * from cart where username = '"+_email+"'";
                con.query(p,(err1,result1)=>{
                    if(err1)
                    {
                        console.log("Error in fetching rows from cart");
                        console.log(err1);
                    }
                    else{
                        req.session.email = _email;
                        req.session.cart = result1;
                        if(_email == 'admin@gmail.com')
                        {
                            req.session.admin = 1;
                        }
                        else{
                            req.session.admin = 0;
                            
                        }
                        if(req.session.email == '')
                        {
                            res.redirect('/');
                        }
                        else
                        {
                            console.log('Login Successfull');
                            res.redirect('/books');
                        }
                    }
                });

            

            }
            else{
                res.redirect('/');
                console.log('Account does not exist');
            }
        }
    });
    
});

    app.get('/userdashboard',(req,res)=>
    {
        res.header('cache-control','no-cache,private,no-store,must-revalidate,max-stale=0,post-check=0,pre-check=0');
        if(!req.session.email)
        {
            res.redirect('/');
        }
        else{
        res.render('login-user.ejs');
    }
    });

        app.get('/books',(req,res)=>{
            
            var q = "select name from category";
            con.query(q,(err,result)=>{
                if(err)
                throw err;
                var p = "select * from books";
                con.query(p,(err1,result1)=>{
                    if(err)
                    throw err;
                    if(result.length){
                        res.render('books.ejs',{ items : 'Present',category : result,books : result1 });
                                
                            }
                            else{
                        res.render('books.ejs',{ items : 'Absent',category : result,books : result1 });
                                
                            }
                    // res.render('books.ejs',{category : result,books : result1});
                });
            });
        
        });
        app.get('/emsg',(req,res)=>
        {
            res.render('emsg.ejs');
        });
        app.get('/success',(req,res)=>
        {
            var u = url.parse(req.url,true).query;
            console.log(u.name);
            console.log(u.password);
            req.flash('success','You are logged In');
            req.flash('danger','You are correct user');
            req.flash('warning','Remember your credentials');
            res.render('successfull.ejs');
                       
        });
        app.get('/books/category/:name',(req,res)=>{

            var _name = req.params.name;
            var q = "select * from books where category = '"+_name+"'";
            con.query(q,(err,result)=>{
                if(err)
                throw err;

                var p = "select name from category";
                con.query(p,(err1,result1)=>{
                    if(err1)
                    throw err1;
                    if(result.length){
                res.render('books.ejs',{ items : 'Present',category : result1,books : result });
                        
                    }
                    else{
                res.render('books.ejs',{ items : 'Absent',category : result1,books : result });
                        
                    }
                    
                });
            });
    
        });
app.get('/books/:name/:id',(req,res)=>{
            var _name = req.params.name;
            var _id = req.params.id;
            console.log(_name);
            console.log(_id);
            var q = "select * from books where id = '"+_id+"'";
            con.query(q,(err,result)=>{
                if(err)
                throw err;
                var p = "select name from category";
                con.query(p,(err1,result1)=>{
                    if(err1)
                    throw err1;
                    var r = "select * from comment where bookid = '"+_id+"'";
                    con.query(r,(err2,result2)=>{
                        if(err2)
                        {
                            console.log("Error in fetching comments");
                            console.log("err2");
                        }
                        else{
                            console.log('comments is :',result2);
                            res.render('book_detail.ejs',{ category : result1, book : result[0] , com : result2 });
                            
                        }
                    });
                    
                });
            });
        
        });
        app.get('/addtocart/:id',(req,res)=>{
            var _id = req.params.id;
            console.log('Book id is :',_id);
            var q = "select * from cart where bookid = '"+_id+"' and username = '"+req.session.email+"'";
            con.query(q,(err,result)=>{
                if(err)
                {
                    console.log('error in fetch the row of id in books');
                    console.log(err);
                    throw err;
                }
                else{
                        console.log(result);
                        console.log(req.session.email);
                        if(result.length == 0)
                        {
                            var r = "select * from books where id = '"+_id+"'";
                            con.query(r,(err1,result1)=>{
                                if(err1)
                                {
                                    console.log("Error in fetching books from database");
                                    console.log(err1);
                                    return err;
                                }
                                else{
                                    var quan = 0
                                    quan++;
                                    if(quan <= result1[0].quantity)
                                    {
                                        var p = "insert into cart set username ='"+req.session.email+"',bookid='"+_id+"',title='"+result1[0].title+"',qty=1,pprice='"+result1[0].sale_price+"',oprice='"+result1[0].original_price+"',img='"+result1[0].image+"'";
                                        con.query(p,(err1,result1)=>{
                                            if(err1)
                                            {
                                                console.log('err in insertion of cart book');
                                                console.log(err1);
                                            }
                                            else
                                            {
                                            console.log('insertion successfull in cart');
                                            var z = "select * from cart where username = '"+req.session.email+"'";
                                            con.query(z,(err2,result2)=>{
                                                if(err2)
                                                {
                                                    console.log("error in fetching rows from cart");
                                                    console.log(err3);
                                                }
                                                else{
                                                    req.session.cart = result2;
                                                    req.flash('success','Inserted in Cart Successfully');
                                                    res.redirect('back');
                                                    // res.redirect('/books');
                                                }
                                            });
    
                                            }
                                        });                                        
                                    }
                                    else{
                                        req.flash('danger','Item is Out of Stock');
                                        res.redirect('back');
                                    }

                                }

                            });

                        }
                        else{
                                    var q = result[0].qty;
                                    q++;
                                    var x ="select * from books where id = '"+_id+"'";
                                    con.query(x,(err1,result1)=>{
                                        if(err1)
                                        {
                                            console.log(err1);
                                        }
                                        else{
                                            console.log(result1);
                                            if( q <= result1[0].quantity)
                                            {
                                                var p = "update cart set qty = '"+q+"' where bookid = '"+_id+"' and username = '"+req.session.email+"'";
                                                con.query(p,(err11,result11)=>{
                                                    if(err)
                                                    {
                                                        console.log("error in update quantity");
                                                        console.log(err11);
                                                    }
                                                    else{
                                                        console.log("Updated in Cart");
                                                        req.flash('success','inserted in cart successfully');
                                                        res.redirect('back');
            
                                                    }
                                                });
                                            }
                                            else{
                                                req.flash('danger','Item Out of stock');
                                                console.log('out of stock');
                                                res.redirect('back');
                                            }
                                        }
                                    });


                                
                                }
                           

                        }
                    });
                    });

        app.get('/updatecart/:bookid',(req,res)=>{
            console.log('Enter');
            var _id = req.params.bookid;
            var q = "delete from cart where bookid = '"+_id+"' and username = '"+req.session.email+"'";
            con.query(q,(err,result)=>{
                if(err)
                {
                    console.log('Error in deleting the cart');
                    console.log(err);
                }
                else{

                    var p ="select * from cart where username = '"+req.session.email+"'";
                    con.query(p,(err1,result1)=>{
                        if(err1)
                        throw err1;
                        else{
                            console.log('cart updated successfully');
                            req.session.cart=result1;
                            res.redirect('/checkout');
                        }
                    });

                }
            });
        });                  
        
        app.get('/update/:id/:qty',(req,res)=>{
            var _id = req.params.id;
            var _qty = req.params.qty;
            var q = "select * from books where id = '"+_id+"'";
            con.query(q,(err,result)=>{
                if(err)
                {
                    console.log("Error ion fetching the books from table");
                    console.log(err);
                }
                else
                {
                    var q = _qty;
                    q++;
                    if(q <= result[0].quantity )
                    {
 
                        var p = "update cart set qty = '"+q+"' where bookid = '"+_id+"' and username = '"+req.session.email+"' ";
                        con.query(p,(err1,result1)=>{
                            if(err1)
                            {
                                console.log(err1);
                            }
                            else{
                                var r = "select * from cart where username ='"+req.session.email+"'";
                                con.query(r,(err2,result2)=>{
                                    if(err2)
                                    {
                                        console.log(err2);
                                    }
                                    else
                                    {
                                        req.session.cart = result2;
                                        console.log('updatwed in cart by session');
                                        req.flash('success','Item increased');                                        
                                        res.redirect('back');
                                    }
                                });
                            }
                        });
                    }
                    else{
                        req.flash('danger','Item is Out of Stock Now');
                        res.redirect('back');
                    }
                }
            });
        });

        app.get('/updateminus/:id/:qty',(req,res)=>{
            var _id = req.params.id;
            var _qty = req.params.qty;
            var q = "select * from books where id = '"+_id+"'";
            con.query(q,(err,result)=>{
                if(err)
                {
                    console.log("Error ion fetching the books from table");
                    console.log(err);
                }
                else
                {
                    var q = _qty;
                    q--;
                    if(q != 0)
                    {
 
                        var p = "update cart set qty = '"+q+"' where bookid = '"+_id+"' and username = '"+req.session.email+"'";
                        con.query(p,(err1,result1)=>{
                            if(err1)
                            {
                                console.log(err1);
                            }
                            else{
                                var r = "select * from cart where username ='"+req.session.email+"'";
                                con.query(r,(err2,result2)=>{
                                    if(err2)
                                    {
                                        console.log(err2);
                                    }
                                    else
                                    {
                                        req.session.cart = result2;
                                        console.log('updation in cart by session');
                                        req.flash('success','Item Decreased');          
                                        res.redirect('back');
                                    }
                                });
                            }
                        });
                    }
                    else{
                        var w = "delete from cart where bookid = '"+_id+"'";
                        con.query(w,(err3,result3)=>{
                            if(err3)
                            {
                                console.log(err3);
                                console.log('error in delete row of cart');
                            }
                            else
                            {
                                console.log('result 3 is : ',result3);
                                var e = "select * from cart where username = '"+req.session.email+"'";
                                con.query(e,(err4,result4)=>{
                                    if(err4)
                                    {
                                        console.log(err4);
                                        console.log('error in fetch the cart');                                        
                                    }
                                    else{
                                        console.log(result4);
                                        req.session.cart = result4;
                                        console.log('Cart updated from deleltion of item from cart by decrement');
                                        res.redirect('back');
                                        
                                    }
                                });
                            }
                        });
                    }
                }
            });
        });

        app.get('/clear',(req,res)=>{
            var q = "delete from cart where username = '"+req.session.email+"'";
            con.query(q,(err,result)=>{
                if(err)
                {
                    console.log("error in delete the cart rows");
                    console.log(err);
                }
                else{
                        console.log('result is :',result);
                        var p = "select * from cart where username = '"+req.session.cart+"'";
                        con.query(p,(err1,result1)=>{
                            if(err1)
                            {
                                console.log("Error in fetching the row from cart");
                                console.log(err1);
                            }
                            else
                            {
                                console.log('cart clear');
                                req.session.cart = result1;
                                res.redirect('back');
                            }
                        });
                }
            });
        });
        app.get('/checkout',(req,res)=>{
            var p ="select name from category";
            con.query(p,(err1,result1)=>
            {
                if(err1)
                {
                    console.log("Error in selecting category");
                    console.log(err1);
                }
                else{
                    var q = "select * from cart where username = '"+req.session.email+"'";
                    con.query(q,(err,result)=>{
                    if(err)
                    {
                        console.log("Error to select rows of cart");
                        console.log(err);
                    }
                    else{
                            res.render('cart.ejs',{cart1 : result,category : result1});
                        
                    }
            });
                }
            });
        });

        app.post('/submitcomment/:id',(req,res)=>{
                var _id = req.params.id;
                console.log(_id);
                var _comment = req.body.comm;
                console.log(_comment);
                var q = "insert into comment set comments = '"+_comment+"',email = '"+req.session.email+"',bookid = "+_id;
                con.query(q,(err,result)=>{
                    if(err)
                    {
                        console.log('Error in inserting comments');
                        console.log(err);
                    }
                    else{
                        res.redirect('back');
                    }
                });
            });
      app.get('/commentdelete/:bid',(req,res)=>{
            var _id = req.params.bid;
            console.log('delete id is',_id);
            var q = "delete from comment where bookid = '"+_id+"' and email='"+req.session.email+"'";
            con.query(q,(err,result)=>{
                if(err)
                {
                    console.log("Error in deleting the book");
                    console.log(err);
                }
                else{
                    res.redirect('back');
                }
            });  

      });   
    //   app.get('/commentedit/:id',(req,res)=>{
    //       var _id = req.params.id;
    //       var p = "select comments from comment where bookid = '"+_id+"'";

    //   });   
      app.get('/sellbooks',(req,res)=>{
        var q = "select name from category";
        con.query(q,(err,result)=>{
            if(err){
                console.log('Error in Fetching the Categories');
                console.log(err);
            }
            else{
                res.render('sellbook.ejs',{ category : result});
            }
        });
      });

      app.post('/submitsellbook',(req,res)=>{    
        var scat = req.body.sellcat;
        var stitle = req.body.selltitle;
        var slanguage = req.body.selllanguage;
        var sauthor = req.body.sellauthor;
        var spublisher = req.body.sellpublisher;     
        var sdescription = req.body.selldescription;  
        var sedition = req.body.selledition;
        var soprice = req.body.selloprice;
        var spprice = req.body.sellsprice;
        var squan= req.body.sellquan;
        var scontact = req.body.sellcontact;
        console.log(scontact);
        var simageFile = typeof req.files.filetoupload != 'undefined' ? req.files.filetoupload.name : '';
        // var imageFile = typeof req.files.filetoupload !='undefined' ? req.files.filetoupload.name : ' ';
        console.log(simageFile);
        var q = "insert into sellerbooks set category = '"+scat+"',title = '"+stitle+"',language = '"+slanguage+"',author = '"+sauthor+"',publisher ='"+spublisher+"',description = '"+sdescription+"',edition = '"+sedition+"',original_price = '"+soprice+"',sale_price = '"+spprice+"',image = '"+simageFile+"',quantity = '"+squan+"',email = '"+req.session.email+"',contact_no = '"+scontact+"'";
        con.query(q,(err,result)=>{
            if(err) {
                console.log('Error in inserting seller book');
                console.log(err);
            }
            else {
                console.log('SellerBook Inserted');
                res.redirect('back');
            }
        });
    });

    app.get('/oldbooks',(req,res)=>{
        var q = "select name from category";
        con.query(q,(err,result)=>{
            if(err){
                console.log("Error in Fetching the category");
                console.log(err);
            }
            else{
                var p = "select * from sellerbooks";
                con.query(p,(err1,result1)=>{
                    if(err1) {
                        console.log('Error in Fetching old books from SellerBooks');
                        console.log(err1);
                    }
                    else{
                        if(result1.length){
                        res.render('oldbooks.ejs',{items : 'Present',category : result,books : result1});    
                        }
                        else{
                        res.render('oldbooks.ejs',{items : 'Absent',category : result,books : result1});    
                            
                        }
                    }
                });
            }
        });
    });
    app.get('/mybooks',(req,res)=>{
        var q = "select * from sellerbooks where email = '"+req.session.email+"'";
        con.query(q,(err,result)=>{
            if(err) {
                console.log('Error in Fetching the sellerbooks');
                console.log(err);
            }
            else{
                var p = "select name from category";
                con.query(p,(err1,result1)=>{
                    if(err1) {
                        console.log('Error in Fetching Category');
                        console.log(err1);
                    }
                    else{
                        if(result.length) {
                            res.render('mybooks.ejs',{ items : 'Present',category : result1,books : result})

                        }
                        else{
                         res.render('mybooks.ejs',{ items : 'Absent',category : result1,books : result})
                            
                        }
                        
                    }
                });
            }
        });
    });

    app.get('/oldbooks/:name/:id',(req,res)=>{
        var _name = req.params.name;
        var _id = req.params.id;
        console.log(_id);
        var q = "select * from sellerbooks where id = '"+_id+"'";
        con.query(q,(err,result)=>{
            if(err) {
                console.log('Error in Find book from sellerbooks');
                console.log(err);
            }

            var p ="select name from category";
            con.query(p,(err1,result1)=>{
                if(err1) {
                    console.log(err1);
                }
                console.log(result[0]);
                res.render('oldbook_detail.ejs',{category : result1 , book : result[0]});
            });
        });    
    });

    app.get('/deleteoldbook/:id',(req,res)=>{
        var id = req.params.id;
        var q = "delete from sellerbooks where id = '"+id+"'";
        con.query(q,(err,result)=>{
            if(err) {
                console.log('Error in deleting the books');
                console.log(err);
            }
            res.redirect('/mybooks');
        })
    });

    app.get('/old/name/:name',(req,res)=>{
        var name = req.params.name;
        console.log(name);
        var q = "select * from sellerbooks where category = '"+name+"'";
        con.query(q,(err,result)=>{
            if(err) {
                console.log('Error in fetching book of category');
                console.log(err);
            }
            var p = "select name from category";
            con.query(p,(err1,result1)=>{
                if(err1) {
                    console.log('Error in fetching category');
                    console.log(err1);
                }
            if(result.length) {
             res.render('oldbooks.ejs',{ items : 'Present',books : result,category : result1});                
            }
            else {
            res.render('oldbooks.ejs',{ items : 'Absent',books : result,category : result1});
                
            }
                
            });
        });
    });
    app.get('/buynow',(req,res)=>{
        var q = "select * from cart where username = '"+req.session.email+"'";
        con.query(q,(err,result)=>{
            if(err) {
                console.log(err);
            }
            var p = "select name from category";
            con.query(p,(err1,result1)=>{
                if(err1) {
                    console.log(err1);
                }
                 res.render('placeorder.ejs',{category : result1,cart : result});
                 
                
            });
            
        });
    });
    app.post('/placeorder2',(req,res)=>{
        var book_id , qty;
        var booksarray = [];
        var cart = req.session.cart;
        var x = "delete from cart where username = '"+req.session.email+"'";
        console.log(x);
        con.query(x,(err1,res1)=>{
            if(!err1){
                console.log("deletion successful");
            }
            else{
                console.log("err in deletion");
                // console.log(err1);
                throw err1;
            }
        });
        var booksid = [];
        var quantiy = [];
        for(i = 0; i < cart.length; i++){
            var x2 = "select * from books where id = "+cart[i].bookid;
            console.log("cart "+i+"   "+x2);
           
            console.log(cart[i].bookid);
            
            con.query(x2,(err2,res2)=>{
                if(!err2){
                    console.log("accessed books successful");
                    console.log(res2[0]);
                   booksarray = res2;
                   booksid.push(res2[0].id);
                   quantity.push(res2[0].quantity);
                   var quan = res2[0].quantity;
                   quan = quan - 1;
                   var x3 = "update books set quantity = "+ quan+" where id = "+book_id;
                   console.log(x3);
                   if( i == cart.length){
                       console.log("hello in cartlength last");
                       req.redirect("back");
                   }
                }
                else{
                    console.log("err in getting books");
                    // console.log(err2);
                    throw err2;
                }
            });

    
        }

    }); 

    app.post('/placeorder',(req,res)=>{
        var book_id , qty;
        var q = "select * from cart where username = '"+req.session.email+"'";
        con.query(q,(err,result)=>{
            if(err) {
                console.log('Error in fetching cart');
                console.log(err);
            }
            console.log('cart fetch successfull');
            console.log(result);
            var r = "delete from cart where username = '"+req.session.email+"'";
            console.log(r);
            con.query(r,(err2,result2)=>{
                if(err2) {
                    console.log(err2);
                
                }
                else{
                    var e = "select * from cart where username = '"+req.session.cart+"'";
                    con.query(e,(err4,result4)=>{
                        if(err4) {
                            console.log(err4);
                            throw err4;
                        }
                        req.session.cart = result4;
                        for(var i = 0 ;i<result.length; i++){
                            console.log("i is "+ i);
                            book_id = result[i].bookid;
                            qty = result[i].qty;
                            var p = "insert into buy set username = '"+result[i].username+"',bookid = "+result[i].bookid+",title='"+result[i].title+"',pprice="+result[i].pprice+",oprice="+result[i].oprice+",qty="+result[i].qty+",img='"+result[i].img+"'";
                            con.query(p,(err1,result1)=>{
                                if(err1) {
                                    console.log('Error in insertion of buy');
                                    console.log(err1);
                                    throw err1;
    
                                }
                                else{
                                    console.log(p);
                                    console.log("Insertion In Buy Successfull");
                                    console.log(book_id);
                                    // console.log(result[i].bookid);
                                    
                                }                                                
                                
                            });
                            console.log("i again is "+ i);
                            
                        }
                        if(i == result.length){
                            console.log("succeeded now reached books"); 
                           
                        }

                    });
                }
                
                
            });

            
            
        });
        delete req.session.cart;
        res.redirect('/books');
    });

    app.get('/yourorders',(req,res)=>{
        var p ="select name from category";
        con.query(p,(err1,result1)=>
        {
            if(err1)
            {
                console.log("Error in selecting category");
                console.log(err1);
            }
            else{
                var q = "select * from buy where username = '"+req.session.email+"'";
                console.log(q);
                con.query(q,(err,result)=>{
                if(err)
                {
                    console.log("Error to select rows of cart");
                    console.log(err);
                }
                else{
                        res.render('yourorders.ejs',{cart1 : result,category : result1});
                    
                }
        });
            }
        }); 
    });
app.listen(3000);
