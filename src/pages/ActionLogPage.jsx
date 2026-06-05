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
    TextField,
    Typography
} from "@mui/material";

import api from "../api/api";
import Navbar from "../components/Navbar";


const actionLabels = {
    ticket_created: "Создание заявки",
    ticket_joined: "Присоединение к заявке",
    tickets_merged: "Объединение заявок",
    executor_assigned: "Назначение исполнителя",
    executor_unassigned: "Снятие исполнителя",
    subscriber_unlinked: "Отвязка подписчика",
    status_changed: "Изменение статуса",
    comment_added: "Комментарий"
};


function ActionLogPage() {

    const [entries, setEntries] = useState([]);
    const [ticketId, setTicketId] = useState("");
    const [limit, setLimit] = useState("100");
    const [error, setError] = useState("");

    const getAuthHeaders = useCallback(() => ({
        Authorization: `Bearer ${localStorage.getItem("token")}`
    }), []);

    const fetchEntries = useCallback(async () => {

        try {

            const response = await api.get(
                "/tickets/action-log",
                {
                    headers: getAuthHeaders(),
                    params: {
                        ticket_id: ticketId || undefined,
                        limit: limit || 100
                    }
                }
            );

            setEntries(response.data);

        } catch (err) {
            console.error(err);
            setError("Не удалось загрузить журнал действий.");
        }
    }, [getAuthHeaders, limit, ticketId]);

    useEffect(() => {

        const timeoutId = window.setTimeout(() => {
            fetchEntries();
        }, 300);

        return () => window.clearTimeout(timeoutId);

    }, [fetchEntries]);

    return (
        <Box sx={{ minHeight: "100vh" }}>
            <Navbar />

            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Stack spacing={3}>
                    <Box>
                        <Typography variant="h4" gutterBottom>
                            Журнал действий
                        </Typography>
                        <Typography color="text.secondary">
                            Аудит значимых операций с заявками.
                        </Typography>
                    </Box>

                    {error && (
                        <Alert severity="error">{error}</Alert>
                    )}

                    <Card>
                        <CardContent>
                            <Stack
                                direction={{ xs: "column", sm: "row" }}
                                spacing={2}
                            >
                                <TextField
                                    label="Номер заявки"
                                    type="number"
                                    value={ticketId}
                                    onChange={(event) =>
                                        setTicketId(event.target.value)
                                    }
                                />
                                <TextField
                                    label="Лимит"
                                    type="number"
                                    value={limit}
                                    onChange={(event) =>
                                        setLimit(event.target.value)
                                    }
                                />
                                <Button
                                    variant="outlined"
                                    onClick={() => {
                                        setTicketId("");
                                        setLimit("100");
                                    }}
                                >
                                    Сбросить
                                </Button>
                            </Stack>
                        </CardContent>
                    </Card>

                    <Stack spacing={2}>
                        {entries.length === 0 && !error && (
                            <Card>
                                <CardContent sx={{ py: 5, textAlign: "center" }}>
                                    <Typography color="text.secondary">
                                        Записей пока нет.
                                    </Typography>
                                </CardContent>
                            </Card>
                        )}

                        {entries.map((entry) => (
                            <Card key={entry.id}>
                                <CardContent>
                                    <Stack spacing={1}>
                                        <Stack
                                            direction="row"
                                            spacing={1}
                                            sx={{ flexWrap: "wrap", rowGap: 1 }}
                                        >
                                            <Chip
                                                label={actionLabels[entry.action] || entry.action}
                                                color="primary"
                                                variant="outlined"
                                            />
                                            {entry.ticket_id && (
                                                <Chip label={`Заявка #${entry.ticket_id}`} />
                                            )}
                                            {entry.user_role && (
                                                <Chip
                                                    label={entry.user_role}
                                                    variant="outlined"
                                                />
                                            )}
                                        </Stack>
                                        <Typography variant="body2" color="text.secondary">
                                            {entry.user_name || "Система"}
                                            {" · "}
                                            {new Date(entry.created_at).toLocaleString("ru-RU")}
                                        </Typography>
                                        {entry.details && (
                                            <Typography>
                                                {entry.details}
                                            </Typography>
                                        )}
                                    </Stack>
                                </CardContent>
                            </Card>
                        ))}
                    </Stack>
                </Stack>
            </Container>
        </Box>
    );
}

export default ActionLogPage;
