from flask import jsonify

def login_user(data, users_collection, is_valid):    
    email = data.get('email')
    password = data.get('password')
    # Check if user already exists
    user = list(users_collection.find({'email': email}))

    if not user:
        return jsonify({'error': 'Incorrect email or password'}), 400
    
    is_password_valid = is_valid(user[0]['password'], password)
    if not is_password_valid:
        return jsonify({'error': 'Incorrect email or password'}), 400
    
    return jsonify({
        'message': 'User logged in successfully',
    }), 200