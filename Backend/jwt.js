// jwt.js
const jwt = require('jsonwebtoken');

const secretKey = '1234!!!!QWe'; 

// In-memory token blacklist
const tokenBlacklist = new Set();

const authenticateJWT = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    
    if (token) {
        // Check if the token is blacklisted
        if (tokenBlacklist.has(token)) {
            return res.status(403).json({ message: 'Token has been invalidated' });
        }

        jwt.verify(token, secretKey, (err, user) => {
            if (err) {
                return res.status(403).json({ message: 'Invalid token' });
            }
            req.user = user;
            next();
        });
    } else {
        res.status(401).json({ message: 'No token provided' });
    }
};

const deleteJWT = (token) => {
    // Add the token to the blacklist
    tokenBlacklist.add(token);
};

const refreshJWT = (user) => {
    return jwt.sign(user, secretKey, { expiresIn: '1h' });
};

module.exports = {
    authenticateJWT,
    deleteJWT,
    refreshJWT
};
