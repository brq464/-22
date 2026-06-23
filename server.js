const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

const DB_FILE = './users.json';

function loadUsers() {
  if (fs.existsSync(DB_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch (e) {
      return {};
    }
  }
  return {};
}

function saveUsers() {
  fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
}

let online = 0;
let users = loadUsers();

io.on('connection', (socket) => {

  online++;
  io.emit('online', online);

  socket.on('login', (data) => {
    const username = data.username;
    if (!users[username]) {
      users[username] = {
        money: 500000,
        job: 'تاجر',
        loan: 0,
        level: 1
      };
      saveUsers();
    }
    socket.username = username;
    socket.emit('userData', users[username]);
  });

  socket.on('takeLoan', () => {
    const user = users[socket.username];
    if (!user) return;
    let amount = 0;
    if (user.job === 'عامل') {
      amount = 10000;
    } else if (user.job === 'شرطة') {
      amount = 50000;
    } else {
      amount = 100000;
    }
    user.money += amount;
    user.loan += amount;
    saveUsers();
    socket.emit('userData', user);
  });

  socket.on('salary', () => {
    const user = users[socket.username];
    if (!user) return;
    let salary = 15000;
    if (user.loan > 0) {
      const cut = Math.min(5000, user.loan);
      user.loan -= cut;
      salary -= cut;
    }
    user.money += salary;
    saveUsers();
    socket.emit('userData', user);
  });

  socket.on('disconnect', () => {
    online--;
    io.emit('online', online);
  });

});

server.listen(process.env.PORT || 3000, () => {
  console.log('Server Started');
});
