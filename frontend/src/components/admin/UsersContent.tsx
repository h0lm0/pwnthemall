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
            
            <div className="bg-muted min-h-screen">
                <h1 className="mb-4 text-3xl font-bold">Users</h1>
                <ul className="space-y-2">
                    {users.map((u) => (
                        <li key={u.ID} className="rounded bg-muted p-2">
                            {u.ID}: {u.Username}: {u.Email}
                        </li>
                    ))}
                </ul>
            </div>
        </>
    );
};
