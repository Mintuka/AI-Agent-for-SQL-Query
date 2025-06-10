from flask import jsonify

def register_user(data, users_collection, hash_password):
    email = data.get('email')
    password = data.get('password')
    hashed_password = hash_password(password)
    # Check if user already exists
    isPasswordExisting = users_collection.find_one({'password': hashed_password})
    isEmailExisting = users_collection.find_one({'email': email})
    if isPasswordExisting or isEmailExisting:
        return jsonify({'error': 'Email or Password already exists'}), 400
    
    new_user = {
        'email': email,
        'password': hashed_password,
        # 'created_at': datetime.utcnow()
    }
    
    result = users_collection.insert_one(new_user)
    
    return jsonify({
        'message': 'User registered successfully',
        'user_id': str(result.inserted_id)
    }), 201