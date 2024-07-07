const User = require("../Models/User.Model");

exports.findUser = async (email, role, id) => {
    try {
        let query = {};

        if (email) {
            query.email = email;
        }
        if (role) {
            query.role = role;
        }
        if (id) {
            query._id = id;
        }

      
        const user = await User.findOne(query);

        if (!user && role === "doctor") {
            return res.status(500).json({ error: "No doctor found" });
        }

        if (user) {
            return user;
        } else {
            return null;
        }
    } catch (error) {
        throw error;
    }
};
