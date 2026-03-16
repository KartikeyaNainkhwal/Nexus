import PusherClient from 'pusher-js'

const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

export const pusherClient = pusherKey && pusherCluster
    ? new PusherClient(pusherKey, {
        cluster: pusherCluster,
        authEndpoint: '/api/pusher/auth',
    })
    : null;
