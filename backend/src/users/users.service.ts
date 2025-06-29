// src/users/users.service.ts
import {Injectable} from '@nestjs/common';

export type User = any;

@Injectable()
export class UsersService {
    private readonly users = [
        {
            userId: 1,
            username: 'admin',
            password: 'admin',  // Plaintext for demo ONLY!
            roles: ['admin'],
            tenant: 'companyA'
        },
        {
            userId: 2,
            username: 'user1',
            password: 'user1',
            roles: ['user'],
            tenant: 'companyA'
        },
        {
            userId: 3,
            username: 'user2',
            password: 'user2',
            roles: ['user'],
            tenant: 'companyB'
        }
    ];

    async findOne(username: string): Promise<User | undefined> {
        return this.users.find(user => user.username === username);
    }
}
