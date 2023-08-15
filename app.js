const express = require('express');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const app=express();

app.use(express.json());
app.use(cookieParser());

app.get('/login', (req, res)=>{
  res.send(`<!DOCTYPE html>
  <html>
  <head>
     <title>Login</title>
  </head>
  <body>
  <form action="/success" method="POST" id ="login-form"><input id ="username" type="text", placeholder="username"><br><button type="submit" >Log in</button></form>

  
<script>
  (async function() {
    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', async function(event) {
      event.preventDefault();
      const usernameInput = document.getElementById('username');
      const username = usernameInput.value;

      localStorage.setItem('username', username);
      const response = await fetch('/success', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username })
      });

      if (response.ok) {
        // Redirect to the /message page after successful login
        window.location.href = '/message';
      } else {
        console.error('Login failed');
      }
    });
  })();
</script>

  </body>
  </html>`)
});
app.post('/success', (req, res) => {
  const username = req.body.username;

  // Set the username cookie
  res.cookie('username', username);

  
  res.redirect('/message');
});
app.get('/message', (req, res) => {
  fs.readFile('message.txt', 'utf8', (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // File doesn't exist, create an empty file
        fs.writeFile('message.txt', '', err => {
          if (err) {
            console.error('Error creating message.txt:', err);
            res.status(500).send('Error creating message.txt');
          } else {
            console.log('message.txt created');
            res.redirect('/message'); // Redirect to handle the case after file creation
          }
        });
      } else {
        console.error('Error reading message.txt:', err);
        res.status(500).send('Error reading message.txt');
      }
    } else {
      const messages = data.split('\n');
      res.send(`<!DOCTYPE html>
      <html>
      <head>
        <title>message</title>
      </head>
      <body>
        
        
          ${messages.map(message => `<li>${message}</li>`).join('')}
        
        <form action="/send" method="POST" id="message-form">
          <input id="message" name="message" type="text" placeholder="message"><br>
          <button type="submit">Send</button>
        </form>
        <script>
          const messageForm = document.getElementById('message-form');
          messageForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const messageInput = document.getElementById('message');
            const message = messageInput.value;
            try {
              const response = await fetch('/send', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message })
              });
              if (response.ok) {
                window.location.href = '/message';
              } else {
                console.error('Failed to send message');
              }
            } catch (error) {
              console.error('An error occurred:', error);
            }
          });
        </script>
      </body>
      </html>`);
    }
  });
});



app.post('/send', (req, res) => {
  try {
    // Process the sent message data here
    const username = req.cookies.username;
    const message = req.body.message;

    if (username === undefined) {
      console.error('Username not found in cookies');
      res.status(400).send('Username not found in cookies');
      return;
    }

    if (message === undefined || message.trim() === '') {
      console.error('Empty message');
      res.status(400).send('Empty message');
      return;
    }


    // Combine username with its message
    const entry = `${username}: ${message}\n`;

    // Append the entry to the message.txt file
    fs.appendFile('message.txt', entry, (err) => {
      if (err) {
        console.error('Error writing to message.txt:', err);
        res.status(500).send('Error writing to message.txt');
      } else {
        console.log('Message saved to message.txt');
        res.redirect('/message'); // Redirect back to the message form
      }
    });
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).send('An error occurred');
  }
});

app.listen(3000);