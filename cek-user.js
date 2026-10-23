const prisma = require('./db');

async function main() {
  const users = await prisma.users.findMany({
    select: {
      id: true,
      name: true,
      email: true
    },
    orderBy: { id: 'desc' },
    take: 5
  });

  console.table(users.map(user => ({
    id: user.id.toString(),
    name: user.name,
    email: user.email
  })));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
