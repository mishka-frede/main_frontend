import {
    useCallback,
    useEffect,
    useState
} from "react";

import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Container,
    Stack,
    Typography
} from "@mui/material";

import {
    Link
} from "react-router-dom";

import api from "../api/api";
import Navbar from "../components/Navbar";


function NotificationsPage() {

    const [notifications, setNotifications] =
        useState([]);

    const [error, setError] =
        useState("");

    const getAuthHeaders = useCallback(() => ({
        Authorization: `Bearer ${localStorage.getItem("token")}`
    }), []);

    const loadNotifications = useCallback(async () => {

        try {

            const response = await api.get(
                "/notifications/",
                {
                    headers: getAuthHeaders()
                }
            );

            setNotifications(response.data);

        } catch (err) {
            console.error(err);
            setError("Не удалось загрузить уведомления.");
        }
    }, [getAuthHeaders]);

    useEffect(() => {

        const timeoutId = window.setTimeout(() => {
            loadNotifications();
        }, 0);

        return () => window.clearTimeout(timeoutId);

    }, [loadNotifications]);

    const markRead = async (notificationId) => {

        await api.patch(
            `/notifications/${notificationId}/read`,
            {},
            {
                headers: getAuthHeaders()
            }
        );

        loadNotifications();
    };

    return (

        <Box sx={{ minHeight: "100vh" }}>
            <Navbar />

            <Container maxWidth="md" sx={{ py: 4 }}>
                <Stack spacing={3}>
                    <Typography variant="h4">
                        Уведомления
                    </Typography>

                    {error && (
                        <Alert severity="error">
                            {error}
                        </Alert>
                    )}

                    {notifications.length === 0 && !error && (
                        <Card>
                            <CardContent sx={{ py: 4, textAlign: "center" }}>
                                <Typography color="text.secondary">
                                    Уведомлений пока нет.
                                </Typography>
                            </CardContent>
                        </Card>
                    )}

                    {notifications.map((item) => (
                        <Card key={item.id}>
                            <CardContent>
                                <Stack spacing={1.5}>
                                    <Stack
                                        direction="row"
                                        spacing={1}
                                        alignItems="center"
                                    >
                                        <Typography variant="h6">
                                            {item.title}
                                        </Typography>
                                        {!item.is_read && (
                                            <Chip
                                                size="small"
                                                label="Новое"
                                                color="primary"
                                            />
                                        )}
                                    </Stack>

                                    <Typography>
                                        {item.message}
                                    </Typography>

                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        {new Date(item.created_at).toLocaleString("ru-RU")}
                                    </Typography>

                                    <Stack direction="row" spacing={1}>
                                        {item.ticket_id && (
                                            <Button
                                                component={Link}
                                                to={`/tickets/${item.ticket_id}`}
                                                variant="outlined"
                                                size="small"
                                            >
                                                Открыть заявку
                                            </Button>
                                        )}

                                        {!item.is_read && (
                                            <Button
                                                size="small"
                                                onClick={() => markRead(item.id)}
                                            >
                                                Прочитано
                                            </Button>
                                        )}
                                    </Stack>
                                </Stack>
                            </CardContent>
                        </Card>
                    ))}
                </Stack>
            </Container>
        </Box>
    );
}

export default NotificationsPage;
