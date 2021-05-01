from flask import Flask
app = Flask(__name__)
 
# Test Routing Page
@app.route('/')
def index():
  return 'Index Page'
