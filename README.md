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
        OPENAI_API_KEY=asd
        PORT=8080
        ASSISTANT_ID=asst_asd
        LEYES_SALTA_VS_ID=vs_asd
        PROJECT_NAME=group_ai_salta_backend
        SERVER_URL=http://localhost
        FRONTEND_URL=http://localhost:5173

        # JWT AND CERTS
        JWT_SECRET=asd
        JWT_REFRESH_SECRET=asd
        KEY_PATH=~/certs/key.pem
        CERT_PATH=~/certs/cert.pem

        # Paths
        DOWNLOADS_PATH=~/downloads
        UPLOADS_PATH=~/uploads

        # Database
        DB_NAME=group_ai_salta
        DB_USER=root
        DB_PASSWORD=admin123
        DB_HOST=localhost
        DB_PORT=5432
        ```

5. **Create necessary directories**:
    - Create the `downloads` and `uploads` directories:
        ```sh
        mkdir -p ~/downloads ~/uploads
        ```

    - Add the following lines to your `.env` file:
        ```env
        DOWNLOADS_PATH=~/downloads
        UPLOADS_PATH=~/uploads
        ```


6. **Install Flyway CLI**:
    - Download and extract Flyway CLI:
        ```sh
        wget -qO- https://download.red-gate.com/maven/release/com/redgate/flyway/flyway-commandline/10.19.0/flyway-commandline-10.19.0-linux-x64.tar.gz | tar -xvz
        ```
    - Create a symbolic link to make Flyway accessible from anywhere:
        ```sh
        sudo ln -s `pwd`/flyway-10.19.0/flyway /usr/local/bin
        ```

7. **Run Migrations**:
    - To run migrations, use the following command:
        ```sh
        flyway -configFiles=db/flyway.conf migrate
        ```
    - or you can use the npm script:
        ```sh
        npm run build:migrate
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