import Head from "next/head";

interface UsersContentProps {
    users: User[]
}

export default function UsersContent({
    users,
}: UsersContentProps) {
    return (
        <>
            <Head>
                <title>pwnthemall - admin zone</title>
            </Head>
            <div className="container mx-auto p-4">
                <h1 className="mb-4 text-3xl font-bold">Users</h1>
                <ul className="space-y-2">
                    {users.map((u) => (
                        <li key={u.id} className="rounded bg-muted p-2">
                            {u.id}: {u.username}: {u.email}
                        </li>
                    ))}
                </ul>
            </div>
        </>
    );
};
