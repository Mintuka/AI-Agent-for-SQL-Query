from flask import jsonify

def register_user(data, users_collection):
    email = data.get('email')
    password = data.get('password')
    
    # Check if user already exists
    isPasswordExisting = users_collection.find_one({'password': password})
    isEmailExisting = users_collection.find_one({'email': email})
    if isPasswordExisting or isEmailExisting:
        return jsonify({'error': 'Email or Password already exists'}), 400
    
    new_user = {
        'email': email,
        'password': password,
        # 'created_at': datetime.utcnow()
    }
    
    result = users_collection.insert_one(new_user)
    
    return jsonify({
        'message': 'User registered successfully',
        'user_id': str(result.inserted_id)
    }), 201