from flask import Flask, render_template, request, redirect, session
import json, os, uuid

app = Flask(__name__)
app.secret_key = 'your_secret_key_here'  # Replace with your generated key

USER_FILE = 'data/users.json'
TASK_FILE = 'data/tasks.json'

def load_users():
    if not os.path.exists(USER_FILE):
        return {}
    with open(USER_FILE, 'r') as f:
        return json.load(f)

def save_users(users):
    with open(USER_FILE, 'w') as f:
        json.dump(users, f)

def load_tasks():
    if not os.path.exists(TASK_FILE):
        return {}
    with open(TASK_FILE, 'r') as f:
        return json.load(f)

def save_tasks(tasks):
    with open(TASK_FILE, 'w') as f:
        json.dump(tasks, f)

@app.route('/')
def home():
    return redirect('/login')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        users = load_users()
        if username in users:
            return "Username already exists!"
        users[username] = {
            'password': password,
            'id': str(uuid.uuid4())
        }
        save_users(users)
        return redirect('/login')
    return render_template('signup.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        users = load_users()
        if username in users and users[username]['password'] == password:
            session['user'] = {
                'username': username,
                'id': users[username]['id']
            }
            return redirect('/dashboard')
        else:
            return "Invalid credentials!"
    return render_template('login.html')

@app.route('/dashboard', methods=['GET', 'POST'])
def dashboard():
    if 'user' not in session:
        return redirect('/login')

    tasks = load_tasks()
    user_id = session['user']['id']
    user_tasks = tasks.get(user_id, [])

    if request.method == 'POST':
        new_task = {
            'id': str(uuid.uuid4()),
            'title': request.form['title'],
            'status': request.form['status'],
            'date': request.form['date']
        }
        user_tasks.append(new_task)
        tasks[user_id] = user_tasks
        save_tasks(tasks)
        return redirect('/dashboard')

    return render_template('dashboard.html', tasks=user_tasks)

@app.route('/delete/<task_id>')
def delete(task_id):
    if 'user' not in session:
        return redirect('/login')

    user_id = session['user']['id']
    tasks = load_tasks()
    user_tasks = tasks.get(user_id, [])
    tasks[user_id] = [t for t in user_tasks if t['id'] != task_id]
    save_tasks(tasks)
    return redirect('/dashboard')

@app.route('/logout')
def logout():
    session.clear()
    return redirect('/login')

if __name__ == '__main__':
    os.makedirs('data', exist_ok=True)
    app.run(debug=True)
