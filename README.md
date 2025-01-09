# Auto-Invoice Service

This service automates invoice notifications for customers before their third payment. It queries Stripe data and a PostgreSQL database to identify customers who require notifications and sends emails via Gmail API.

---

## **Features**
1. Checks for customers with two completed payments over the last 45 days.
2. Identifies upcoming invoices with payments due within 24–72 hours.
3. Sends email notifications to customers via Gmail API.
4. Logs sent emails to a PostgreSQL database to prevent duplicate notifications.

---

## **Getting Started**

### **Prerequisites**

1. **Docker**: Ensure Docker is installed on your system.
2. **Node.js**: Required if running the project locally.
3. **Environment Variables**:
   - Create a `.env` file in the project root with the following:
     ```
     STRIPE_SECRET_KEY=your_stripe_secret_key
     PG_HOST=your_postgres_host
     PG_PORT=5432
     PG_USER=your_postgres_user
     PG_PASSWORD=your_postgres_password
     PG_DATABASE=your_postgres_db
     GOOGLE_SERVICE_ACCOUNT_JSON=base64_encoded_google_credentials
     ```

---

### **Running the Project with Docker**

1. **Build the Docker image**:
   ```bash
   docker build -t auto-invoice-service .
   
2. **Run the Docker container**:
   ```bash
   docker build -t auto-invoice-service .

### **Running the Project Locally**

1. **Install dependencies:**:
   ```bash
   yarn install

2. **Build the project:**:
   ```bash
   yarn build

3. **Run the project:**:
   ```bash
   yarn start