from flask import Flask, render_template, request, redirect, session, flash, url_for,jsonify
import random
import json
from rtc import gen2
import string
import pymongo
import re
import uuid


def generate_uid():
  # Generate a rand
  uid = uuid.uuid4().int
  # Convert the UUID to an integer and take the last 10 digits
  uid = str(uid)[-10:]
  return uid





app = Flask(__name__)
client = pymongo.MongoClient(
  "mongodb+srv://raku:raku1234@cluster0.7dhk4es.mongodb.net/?retryWrites=true&w=majority"
)
# Set a secret key for the session
app.secret_key = 'my_secret_key'

# Set up a dictionary to store user credentials (normally this would be a database)

@app.route('/login', methods=['GET', 'POST'])
def login():
  error = ''
  if 'username' in session:

    
    return render_template('dashboard.html', username=session['username'])
  else:
    if request.method == 'POST':
      print(request.form)
      # Get the username and password from the form submission
      username = request.form['username']
      password = request.form['password']
  
      # Connect to the MongoDB server
  
      # Access the "mydatabase" database and the "users" collection
      db = client["mydatabase"]
      collection = db["users"]
  
      # Find the user with the matching username
      user = collection.find_one({"username": username})
  
      # Check if the user exists and the password is correct
      if user is not None and user["password"] == password:
        # If the login is successful, store the username in the session
        session['username'] = username
        #tt()
        # Redirect the user to the dashboard
        return redirect('/dashboard')
      else:
        # If the login is unsuccessful, display an error message
        error = 'Invalid username or password. Please try again.'
  
    # Render the login page template
    return render_template('login.html',error=error)


@app.route('/signup', methods=['GET', 'POST'])
def signup():
  error = ""
  if request.method == 'POST':
    # Get form data
    username = request.form['username']
    password = request.form['password']
    email = request.form['email']
    

    # Check if the username is more than 6 characters long
    if len(username) < 6:
      error = "Username must be at least 6 characters long"
    # Check if the password is more than 6 characters long
    elif len(password) < 6:
      error = "Password must be at least 6 characters long"
    # Check if the email is valid
    elif not re.match(r'[^@]+@[^@]+\.[^@]+', email):
      error = "Invalid email. Please enter a valid email"

    # Connect to the MongoDB server
    else:
      db = client["mydatabase"]
      collection = db["users"]

      # Check if a user with the same email already exists
      user = collection.find_one({"email": email})
      if user is not None:
        error = "Email already exists"
      else:  # Insert a new document into the collection
        collection.insert_one({
          "username": username,
          "password": password,
          "email": email
        })
        session['username'] = username

        # Redirect to the dashboard
        return redirect('/dasboard')
  return render_template('signup.html',error=error)


@app.route('/channel', methods=['GET', 'POST'])
def channel():
  if request.method == 'POST':
    name = request.form["channelName"]
    db = client["mydatabase"]
    collection = db["token"]
    uid = int(generate_uid())
    # Check if a user with the same name already exists
    user = collection.find_one({"channelname": name})
    if user is not None:
      return "error"

    collection.insert_one({
      "channelname": name,
      "token": str(gen2(name)),
      "user": str(session['username']),
      "uid":uid})
    return str(uid)


@app.route('/invite/<type>/channel=<channel>', methods=['GET', 'POST'])
def invite(type, channel):
  #print(type)
  if request.method == 'GET':
    db = client["mydatabase"]
    collection = db["token"]
    user = collection.find_one({"channelname": channel})
    if str(type) == "guest":
      return render_template('invite.html',
                             channelName=channel,
                             user=user["user"],
                             mode="Guest Mode")
    else:
      if 'username' in session:
        return render_template('invite.html',
                               channelName=channel,
                               user=user["user"],
                               mode="Private Mode")
      else:
        error = "Login First"
        return render_template('login.html', error=error)


@app.route('/delete', methods=['GET', 'POST'])
def delete():
  if request.method == 'POST':
    name = request.form["channelName"]
    db = client["mydatabase"]
    collection = db["token"]
    collection.delete_one({"channelname": name})
    return name


@app.route('/token', methods=['GET', 'POST'])
def token():
  if request.method == 'POST':
    name = request.form["channelName"]
    
    db = client["mydatabase"]
    collection = db["token"]
    user = collection.find_one({"channelname": name})
    if user is not None:
      print("ghjkl")
    else:
      print(user)
    try: del user['_id']
    except: pass
    
    

    return jsonify(user)


def generate_verification_code():
  # Generate a random string of letters and digits
  code = ''.join(random.choices(string.ascii_letters + string.digits, k=6))
  return code


@app.route('/dashboard')
def dashboard():
  # Check if the user is logged in
  if 'username' in session:

    
    return render_template('dashboard.html', username=session['username'])
  else:
    # If the user is not logged in, redirect them to the login page
    return redirect('/login')
    
@app.route('/')
def home():
  return render_template('front.html')

@app.route('/verification', methods=['GET', 'POST'])
def verification():
  if request.method == 'POST':
    # Get form data
    code = request.form['code']

    # Check if entered code matches stored code
    if code == session['code']:
      # Perform signup process (e.g., save user data to database)
      username = session['username']
      password = session['password']
      email = session['email']
      # Save user data to database
      # ...

      # Clear session
      session.clear()

      # Redirect to dashboard
      return redirect(url_for('dashboard'))
    else:
      # Redirect to verification page with error message
      flash('Invalid verification code')
      return redirect(url_for('verification'))
  return render_template('verification.html')


@app.route('/logout')
def logout():
  # Remove the username from the session
  session.pop('username', None)
  # Redirect the user to the login page
  return redirect('/login')
if __name__ == '__main__':
  app.run()