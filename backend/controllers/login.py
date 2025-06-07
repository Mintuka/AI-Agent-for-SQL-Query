from flask import jsonify

def login_user(data, users_collection):    
    email = data.get('email')
    password = data.get('password')
    
    # Check if user already exists
    isPasswordExisting = users_collection.find_one({'password': password})
    isEmailExisting = users_collection.find_one({'email': email})
    if not isPasswordExisting or not isEmailExisting:
        return jsonify({'error': 'Incorrect email or password'}), 400
    
    
    return jsonify({
        'message': 'User logged in successfully',
    }), 200