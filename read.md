1. --- source
https://www.youtube.com/watch?v=uosSnR_3MB8&list=PLFmBehh3QjxrGyZM9DXtYIC7EdXpwCOOD&index=4
2. --- setup
-- cd proj_1/backend/user
npm init -y

-- cd proj_1/backend/mail
npm init -y

-- cd proj_1/backend/chat
npm init -y

3. --- install
-- cd proj_1/backend/user
npm i -g typescript
npx tsc -init
npm install -D tsx

npm i express dotenv mongoose
npm i -D @types/express @types/dotenv @types/mongoose nodemon concurrently

npm i redis 
npm i -D @types/redis

npm i amqplib
npm i -D @types/amqplib

npm i jsonwebtoken
npm i -D @types/jsonwebtoken

npm i cors
npm i -D @types/cors

-- cd proj_1/backend/mail
npm i express dotenv mongoose nodemailer amqplib
npm i -D @types/express @types/dotenv @types/mongoose @types/amqplib @types/nodemailer

npm i -D concurrently
npm install -D tsx

-- cd proj_1/backend/chat
npm i express dotenv mongoose jsonwebtoken axios
npm i -D @types/express @types/dotenv @types/mongoose @types/jsonwebtoken 

npm i cloudinary multer multer-storage-cloudinary
npm i -D @types/multer

npm install -D tsx

--- Frontend nextjs
-- cd proj_1/frontend
npx create-next-app@latest .
yes - yes - yes

npm i js-cookie

npm i lucide-react @types/js-cookie axios
npm i react-hot-toast


4. --- run
-- cd proj_1/backend/mail
tsc
npm run dev

-- cd proj_1/backend/user
tsc
npm run dev

-- cd proj_1/backend/chat
tsc
npm run dev

-- cd proj_1/frontend
npm run dev

5. --- docker (rabbitMQ)
cd proj_1/backend/rabbitMQ
docker compose up -d
docker compose down

6. --- deploy

7. link
- mongodb
https://cloud.mongodb.com/v2/6ab47da5fdff8f8ef12df32b#/overview
- upstash
https://console.upstash.com/redis?teamid=0
- rabbitMQ
http://localhost:15672/#/
- google app password
https://myaccount.google.com/apppasswords
- cloudinary
https://console.cloudinary.com/app/c-772f9c0dead98ae314d09274664e33/settings/billing/plans
- frontend
http://localhost:3000