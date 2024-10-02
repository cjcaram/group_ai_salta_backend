# My Application

This is a Node.js application using Express, Sequelize, and PostgreSQL. It provides a REST API with authentication and other functionalities.

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- PostgreSQL

## Installation

1. **Clone the repository**:
    ```sh
    git clone https://github.com/yourusername/yourrepository.git
    cd yourrepository
    ```

2. **Install dependencies**:
    ```sh
    npm install
    ```

3. **Set up PostgreSQL**:
    - Install PostgreSQL:
        ```sh
        sudo apt update
        sudo apt install postgresql postgresql-contrib
        ```
    - Start PostgreSQL service:
        ```sh
        sudo systemctl start postgresql
        sudo systemctl enable postgresql
        ```
    - Switch to the `postgres` user and open the PostgreSQL prompt:
        ```sh
        sudo -i -u postgres
        psql
        ```
    - Create a new database and user:
        ```sql
        CREATE DATABASE mydatabase;
        CREATE USER myuser WITH ENCRYPTED PASSWORD 'mypassword';
        GRANT ALL PRIVILEGES ON DATABASE mydatabase TO myuser;
        ```
    - Exit the PostgreSQL prompt:
        ```sql
        \q
        exit
        ```

4. **Configure environment variables**:
    - Create a `.env` file in the root directory of your project and add the following:
        ```env
        PORT=3000
        DB_NAME=mydatabase
        DB_USER=myuser
        DB_PASSWORD=mypassword
        DB_HOST=localhost
        JWT_SECRET=your_jwt_secret
        KEY_PATH=path/to/your/private.key
        CERT_PATH=path/to/your/certificate.crt
        ```

## Running the Application

1. **Build and run the application**:
    ```sh
    npm start
    ```

2. **Access the application**:
    - The server will be running on `http://localhost:3000`.
    - The API endpoints will be available under `/api` and `/auth`. (TODO: complete the list)

## API Endpoints

### Authentication

- **Register**: `POST /auth/register`
    ```json
    {
      "username": "testuser",
      "password": "testpassword"
    }
    ```

- **Login**: `POST /auth/login`
    ```json
    {
      "username": "testuser",
      "password": "testpassword"
    }
    ```

### Civil

(TODO: complete the list)

- **Example Protected Route**: `GET /api/protected-route`
    - Requires a valid JWT token in the `Authorization` header.

## License

This project is licensed under the MIT License.