const { PrismaClient } = require('@prisma/client')

const userData = require("./data.json")
const banners = require("./banners.json")

const prisma = new PrismaClient()

async function main() {
  await prisma.$connect();
  console.log(`Start seeding ...`);
  try {
    let index = 0
    for (const u of userData) {
      const uPosts = u.posts.map(x => {
        index++
        return Object.assign(x, {
          banner: banners[index]
        })
      })
      delete u.posts;
      const user = await prisma.user.create({
        data: u,
      })
      
      await prisma.post.createMany({
        data: uPosts.map(p => Object.assign(p, {
          authorId: user.id
        })),
      })
      console.log(`Created user with id: ${user.id}; added ${uPosts.length} posts`)
    }
    console.log(`Seeding finished.`)
  } catch(err) {
    console.log({err})
  }
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
