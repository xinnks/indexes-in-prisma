# REST API Example with Prisma Index Configuration

> This example takes inspiration from [Prisma's javascript rest-express example](https://github.com/prisma/prisma-examples-latest/javascript/rest-express).

This example shows how to configure indexes in Prisma in implementing a **REST API** using [Express](https://expressjs.com/) and [Prisma Client](https://www.prisma.io/docs/concepts/components/prisma-client). The indexes configuration is carried out using different databases as separated by the branches within this repository.

In the guide below, you'll find instructions to set the project up.

## Getting started

### 1. Download example and install dependencies

Download this example:

```
git clone httpsgit@github.com:xinnks/indexes-in-prisma.git
```

Install npm dependencies:
```
cd indexes-in-prisma
npm install
```

### 2. Create and seed the database

The master branch contains the initial state of the project. To see different index configurations as per the database used, checkout into respective branches (one of `sqlite`, `mysql`, `mongodb`).

Within a specific database branch, run the following command to migrate your database data.

```
# npm
npx prisma migrate dev --name init

# pnpm
pnpm dlx prisma migrate dev --name init
```

Running the above script on the [`sqlite`](https://github.com/xinnks/indexes-in-prisma/tree/sqlite) branch (SQLite database branch) will trigger the creation of the SQLite database file (`./prisma/dev.db`) too.

The script creates the `User` and `Post` tables that are defined in [`prisma/schema.prisma`](./schema.prisma), also, for a newly created database, seeding is also triggered, i.e, the seed file in [`prisma/seed.js`](./prisma/seed.js) will be executed and your database will be populated with the sample data found in [`prisma/data.json`](./prisma/demo.json).

> IMPORTANT: Rename the `sample.env` file to `.env` and populate the environment variables found within with corresponding database urls to be used by Prisma.


### 3. Start the REST API server

```
npm run dev
```

The server is now running on `http://localhost:5000`. You can send the API requests implemented in `index.js`, e.g. [`http://localhost:5000/feed`](http://localhost:5000/feed).

## Using the REST API

You can access the REST API of the server using the following endpoints:

### `GET`

- `/post/:id`: Fetch a single post by its `id`
- `/feed?searchString={searchString}&take={take}&skip={skip}&orderBy={orderBy}`: Fetch all _published_ posts
  - Query Parameters
    - `searchString` (optional): This filters posts by `title` or `content`
    - `take` (optional): This specifies how many objects should be returned in the list
    - `skip` (optional): This specifies how many of the returned objects in the list should be skipped
    - `orderBy` (optional): The sort order for posts in either ascending or descending order. The value can either `asc` or `desc`
- `/user/:id/drafts`: Fetch user's drafts by their `id`
- `/users`: Fetch all users
### `POST`

- `/post`: Create a new post
  - Body:
    - `title: String` (required): The title of the post
    - `content: String` (optional): The content of the post
    - `authorEmail: String` (required): The email of the user that creates the post
- `/signup`: Create a new user
  - Body:
    - `email: String` (required): The email address of the user
    - `name: String` (optional): The name of the user
    - `postData: PostCreateInput[]` (optional): The posts of the user

### `PUT`

- `/publish/:id`: Toggle the publish value of a post by its `id`
- `/post/:id/views`: Increases the `viewCount` of a `Post` by one `id`

### `DELETE`

- `/post/:id`: Delete a post by its `id`


## Evolving the app

Evolving the application typically requires two steps:

1. Migrate your database using Prisma Migrate
1. Update your application code

For the following example scenario, assume you want to add a "profile" feature to the app where users can create a profile and write a short bio about themselves.

### 1. Migrate your database using Prisma Migrate

The first step is to add a new table, e.g. called `Profile`, to the database. You can do this by adding a new model to your [Prisma schema file](./prisma/schema.prisma) file and then running a migration afterwards:

```diff
// ./prisma/schema.prisma

model User {
  id      Int      @default(autoincrement()) @id
  name    String?
  email   String   @unique
  posts   Post[]
+ profile Profile?
}

model Post {
  id        Int      @id @default(autoincrement())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  title     String
  content   String?
  published Boolean  @default(false)
  viewCount Int      @default(0)
  author    User?    @relation(fields: [authorId], references: [id])
  authorId  Int?
}

+model Profile {
+  id     Int     @default(autoincrement()) @id
+  bio    String?
+  user   User    @relation(fields: [userId], references: [id])
+  userId Int     @unique
+}
```

Once you've updated your data model, you can execute the changes against your database with the following command:

```
npx prisma migrate dev --name add-profile
```

This adds another migration to the `prisma/migrations` directory and creates the new `Profile` table in the database.

### 2. Update your application code

You can now use your `PrismaClient` instance to perform operations against the new `Profile` table. Those operations can be used to implement API endpoints in the REST API.

#### 2.1 Add the API endpoint to your app

Update your `index.js` file by adding a new endpoint to your API:

```js
app.post('/user/:id/profile', async (req, res) => {
  const { id } = req.params
  const { bio } = req.body

  const profile = await prisma.profile.create({
    data: {
      bio,
      user: {
        connect: {
          id: Number(id)
        }
      }
    }
  })

  res.send(profile)
})
```

#### 2.2 Testing out your new endpoint

Restart your application server and test out your new endpoint.

##### `POST`

- `/user/:id/profile`: Create a new profile based on the user id
  - Body:
    - `bio: String` : The bio of the user


<details><summary>Expand to view more sample Prisma Client queries on <code>Profile</code></summary>

Here are some more sample Prisma Client queries on the new <code>Profile</code> model:

##### Create a new profile for an existing user

```ts
const profile = await prisma.profile.create({
  data: {
    bio: 'Hello World',
    user: {
      connect: { email: 'alice@prisma.io' },
    },
  },
})
```

##### Create a new user with a new profile

```ts
const user = await prisma.user.create({
  data: {
    email: 'john@prisma.io',
    name: 'John',
    profile: {
      create: {
        bio: 'Hello World',
      },
    },
  },
})
```

##### Update the profile of an existing user

```ts
const userWithUpdatedProfile = await prisma.user.update({
  where: { email: 'alice@prisma.io' },
  data: {
    profile: {
      update: {
        bio: 'Hello Friends',
      },
    },
  },
})
```

</details>

## Switch to another database (e.g. PostgreSQL, MySQL, SQL Server, MongoDB)

If you want to try this example with another database than SQLite, you can adjust the the database connection in [`prisma/schema.prisma`](./prisma/schema.prisma) by reconfiguring the `datasource` block. 

Learn more about the different connection configurations in the [docs](https://www.prisma.io/docs/reference/database-reference/connection-urls).

<details><summary>Expand for an overview of example configurations with different databases</summary>

### PostgreSQL

For PostgreSQL, the connection URL has the following structure:

```prisma
datasource db {
  provider = "postgresql"
  url      = "postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=SCHEMA"
}
```

Here is an example connection string with a local PostgreSQL database:

```prisma
datasource db {
  provider = "postgresql"
  url      = "postgresql://janedoe:mypassword@localhost:5432/notesapi?schema=public"
}
```

### MySQL

For MySQL, the connection URL has the following structure:

```prisma
datasource db {
  provider = "mysql"
  url      = "mysql://USER:PASSWORD@HOST:PORT/DATABASE"
}
```

Here is an example connection string with a local MySQL database:

```prisma
datasource db {
  provider = "mysql"
  url      = "mysql://janedoe:mypassword@localhost:3306/notesapi"
}
```

### Microsoft SQL Server

Here is an example connection string with a local Microsoft SQL Server database:

```prisma
datasource db {
  provider = "sqlserver"
  url      = "sqlserver://localhost:1433;initial catalog=sample;user=sa;password=mypassword;"
}
```

### MongoDB

Here is an example connection string with a local MongoDB database:

```prisma
datasource db {
  provider = "mongodb"
  url      = "mongodb://USERNAME:PASSWORD@HOST/DATABASE?authSource=admin&retryWrites=true&w=majority"
}
```
Because MongoDB is currently in [Preview](https://www.prisma.io/docs/about/releases#preview), you need to specify the `previewFeatures` on your `generator` block:

```
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["mongodb"]
}
```
</details>

## Next steps

- Check out the [Prisma docs](https://www.prisma.io/docs)
- Share your feedback in the [`prisma2`](https://prisma.slack.com/messages/CKQTGR6T0/) channel on the [Prisma Slack](https://slack.prisma.io/)
- Create issues and ask questions on [GitHub](https://github.com/prisma/prisma/)
- Watch our biweekly "What's new in Prisma" livestreams on [Youtube](https://www.youtube.com/channel/UCptAHlN1gdwD89tFM3ENb6w)
