const { PrismaClient } = require('@prisma/client')

const data = require("./data.json")

const prisma = new PrismaClient()

async function main() {
  await prisma.$connect()
  console.log(`Start seeding ...`);
  const userData = data.map(item => {
    const postData = item.posts;
    delete item.posts;
    return Object.assign(item, {posts: {create: postData}})
  })
  for (const u of userData) {
    const user = await prisma.user.create({
      data: u,
    })
    console.log(`Created user with id: ${user.id}`)
  }
  console.log(`Seeding finished.`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
