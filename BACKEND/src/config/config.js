import dotenv from 'dotenv'
dotenv.config();

if(!process.env.PORT) {
    throw new Error("Port not found in environmental variables");
}

if(!process.env.MONGODB_URI) {
    throw new Error("monogodb uri not found in environmental variables");
}

const config = {
    PORT:process.env.PORT || 4000,
    MONGODB_URI:process.env.MONGODB_URI
}

export default config;