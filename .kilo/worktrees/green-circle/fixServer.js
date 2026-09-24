const fs = require('fs');
let server = fs.readFileSync('server.js', 'utf8');

// ডুপ্লিকেট রুট থাকলে রিমুভ করা
server = server.replace(/app\.use\("\/api\/accounts",[\s\S]*?\);\n?/g, '');

// সঠিক জায়গায় রুটটি যুক্ত করা
if (server.includes('app.listen')) {
    server = server.replace('app.listen(', 'app.use("/api/accounts", require("./routes/accountsRoute"));\napp.listen(');
    fs.writeFileSync('server.js', server);
    console.log('Server.js fixed successfully!');
} else {
    console.log('Error: app.listen not found');
}
