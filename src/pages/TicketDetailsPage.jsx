import {
    useCallback,
    useEffect,
    useState
} from "react";

import {
    useParams
} from "react-router-dom";

import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Container,
    Divider,
    Rating,
    Stack,
    TextField,
    Typography
} from "@mui/material";

import api from "../api/api";
import Navbar from "../components/Navbar";


const statusLabels = {
    new: "Новая",
    in_progress: "В работе",
    completed: "Выполнена",
    closed: "Закрыта",
    auto_closed: "Закрыта автоматически",
    dispute_review: "На повторной проверке",
    archived: "Архивирована"
};

const feedbackTypeLabels = {
    review: "Отзыв",
    dispute: "Оспаривание"
};


const roleLabels = {
    admin: "Администратор",
    dispatcher: "Диспетчер",
    executor: "Исполнитель",
    resident: "Жилец"
};


function TicketDetailsPage() {

    const { id } = useParams();

    const [ticket, setTicket] = useState(null);
    const [comments, setComments] = useState([]);
    const [feedbackHistory, setFeedbackHistory] = useState([]);
    const [canSubmitFeedback, setCanSubmitFeedback] = useState(false);
    const [hasActiveDispute, setHasActiveDispute] = useState(false);

    const [text, setText] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const [rating, setRating] = useState(0);
    const [feedbackComment, setFeedbackComment] = useState("");
    const [disputeReason, setDisputeReason] = useState("");
    const [attachmentFiles, setAttachmentFiles] = useState([]);
    const [submittingFeedback, setSubmittingFeedback] = useState(false);

    const getAuthHeaders = useCallback(() => ({
        Authorization: `Bearer ${localStorage.getItem("token")}`
    }), []);

    const fetchTicket = useCallback(async () => {

        try {

            const response = await api.get(`/tickets/${id}`, {
                headers: getAuthHeaders()
            });

            setTicket(response.data);

        } catch (err) {
            console.error(err);
            setError("Не удалось загрузить заявку.");
        }
    }, [getAuthHeaders, id]);

    const fetchComments = useCallback(async () => {

        try {

            const response = await api.get(`/tickets/${id}/comments`, {
                headers: getAuthHeaders()
            });

            setComments(response.data);

        } catch (err) {
            console.error(err);
        }
    }, [getAuthHeaders, id]);

    const fetchFeedback = useCallback(async () => {

        try {

            const response = await api.get(`/tickets/${id}/feedback`, {
                headers: getAuthHeaders()
            });

            setFeedbackHistory(response.data);

        } catch (err) {
            console.error(err);
        }
    }, [getAuthHeaders, id]);

    const fetchCanSubmit = useCallback(async () => {

        try {

            const response = await api.get(
                `/tickets/${id}/feedback/can-submit`,
                { headers: getAuthHeaders() }
            );

            setCanSubmitFeedback(response.data.can_submit);
            setHasActiveDispute(response.data.has_active_dispute);

        } catch (err) {
            console.error(err);
        }
    }, [getAuthHeaders, id]);

    useEffect(() => {

        const timeoutId = window.setTimeout(() => {
            fetchTicket();
            fetchComments();
            fetchFeedback();
            fetchCanSubmit();
        }, 0);

        return () => window.clearTimeout(timeoutId);

    }, [fetchCanSubmit, fetchComments, fetchFeedback, fetchTicket]);

    const addComment = async () => {

        if (!text.trim()) {
            return;
        }

        try {

            await api.post(
                `/tickets/${id}/comments`,
                { text },
                { headers: getAuthHeaders() }
            );

            setText("");
            fetchComments();

        } catch (err) {
            console.error(err);
            setError("Не удалось добавить комментарий.");
        }
    };

    const submitFeedbackJson = async (payload) => {

        await api.post(
            `/tickets/${id}/feedback/json`,
            payload,
            { headers: getAuthHeaders() }
        );
    };

    const submitFeedbackWithFiles = async () => {

        const formData = new FormData();
        formData.append("feedback_type", "dispute");
        formData.append("dispute_reason", disputeReason);
        formData.append("comment", feedbackComment);
        formData.append("confirm_completion", "false");

        attachmentFiles.forEach((file) => {
            formData.append("files", file);
        });

        await api.post(
            `/tickets/${id}/feedback`,
            formData,
            {
                headers: {
                    ...getAuthHeaders(),
                    "Content-Type": "multipart/form-data"
                }
            }
        );
    };

    const handleConfirmCompletion = async () => {

        setSubmittingFeedback(true);
        setError("");
        setMessage("");

        try {

            await submitFeedbackJson({
                feedback_type: "review",
                rating: rating || 5,
                comment: feedbackComment,
                confirm_completion: true
            });

            setMessage("Спасибо! Выполнение подтверждено.");
            refreshAfterFeedback();

        } catch (err) {
            console.error(err);
            setError(getFeedbackError(err));
        } finally {
            setSubmittingFeedback(false);
        }
    };

    const handleSubmitFeedback = async (mode) => {

        setSubmittingFeedback(true);
        setError("");
        setMessage("");

        try {

            if (mode === "dispute") {

                if (!disputeReason.trim()) {
                    setError("Укажите причину оспаривания.");
                    return;
                }

                if (attachmentFiles.length > 0) {
                    await submitFeedbackWithFiles();
                } else {
                    await submitFeedbackJson({
                        feedback_type: "dispute",
                        dispute_reason: disputeReason,
                        comment: feedbackComment,
                        confirm_completion: false
                    });
                }

                setMessage("Оспаривание зарегистрировано. Диспетчер уведомлён.");

            } else {

                await submitFeedbackJson({
                    feedback_type: "review",
                    rating: rating || null,
                    comment: feedbackComment,
                    confirm_completion: false
                });

                setMessage("Отзыв сохранён.");
            }

            refreshAfterFeedback();

        } catch (err) {
            console.error(err);
            setError(getFeedbackError(err));
        } finally {
            setSubmittingFeedback(false);
        }
    };

    const refreshAfterFeedback = () => {

        setRating(0);
        setFeedbackComment("");
        setDisputeReason("");
        setAttachmentFiles([]);
        fetchTicket();
        fetchFeedback();
        fetchCanSubmit();
    };

    const getFeedbackError = (err) => {

        const detail = err.response?.data?.detail;

        const messages = {
            "Feedback is not allowed for this ticket":
                "Обратную связь можно оставить только по выполненным заявкам.",
            "Active dispute already exists for this ticket":
                "Оспаривание уже зарегистрировано и обрабатывается.",
            "Dispute reason is required":
                "Укажите причину оспаривания."
        };

        return messages[detail] || "Не удалось отправить обратную связь.";
    };

    const showFeedbackForm =
        canSubmitFeedback && !hasActiveDispute;

    return (

        <Box sx={{ minHeight: "100vh" }}>
            <Navbar />

            <Container maxWidth="md" sx={{ py: 4 }}>
                <Stack spacing={3}>
                    <Box>
                        <Typography variant="h4" gutterBottom>
                            Заявка #{id}
                        </Typography>
                        <Typography color="text.secondary">
                            Статус, обратная связь и переписка.
                        </Typography>
                    </Box>

                    {message && (
                        <Alert severity="success">{message}</Alert>
                    )}

                    {error && (
                        <Alert severity="error">{error}</Alert>
                    )}

                    {ticket && (
                        <Card>
                            <CardContent>
                                <Stack spacing={1.5}>
                                    <Stack
                                        direction="row"
                                        spacing={1}
                                        sx={{ flexWrap: "wrap", rowGap: 1 }}
                                    >
                                        <Chip
                                            label={
                                                statusLabels[ticket.status]
                                                || ticket.status
                                            }
                                            color={
                                                ticket.status === "dispute_review"
                                                    ? "warning"
                                                    : "default"
                                            }
                                        />
                                        <Chip
                                            label={`Приоритет: ${ticket.priority}`}
                                            variant="outlined"
                                        />
                                    </Stack>
                                    {ticket.category?.name && (
                                        <Typography variant="body2" color="text.secondary">
                                            Категория: {ticket.category.name}
                                        </Typography>
                                    )}
                                    <Typography>{ticket.description}</Typography>
                                </Stack>
                            </CardContent>
                        </Card>
                    )}

                    {hasActiveDispute && (
                        <Alert severity="warning">
                            Заявка на повторной проверке. Ожидайте решения диспетчера.
                        </Alert>
                    )}

                    {showFeedbackForm && (
                        <Card>
                            <CardContent>
                                <Stack spacing={2}>
                                    <Typography variant="h6">
                                        Обратная связь по выполненным работам
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Оцените качество, подтвердите выполнение
                                        или оспорьте результат.
                                    </Typography>

                                    <Box>
                                        <Typography component="legend" gutterBottom>
                                            Оценка (1–5)
                                        </Typography>
                                        <Rating
                                            value={rating}
                                            onChange={(_, value) =>
                                                setRating(value || 0)
                                            }
                                        />
                                    </Box>

                                    <TextField
                                        fullWidth
                                        multiline
                                        minRows={3}
                                        label="Комментарий к отзыву"
                                        value={feedbackComment}
                                        onChange={(e) =>
                                            setFeedbackComment(e.target.value)
                                        }
                                    />

                                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                                        <Button
                                            variant="contained"
                                            color="success"
                                            disabled={submittingFeedback}
                                            onClick={handleConfirmCompletion}
                                        >
                                            Подтвердить выполнение
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            disabled={submittingFeedback}
                                            onClick={() => handleSubmitFeedback("review")}
                                        >
                                            Отправить отзыв
                                        </Button>
                                    </Stack>

                                    <Divider />

                                    <Typography variant="subtitle1">
                                        Оспаривание результата
                                    </Typography>

                                    <TextField
                                        fullWidth
                                        required
                                        label="Причина оспаривания"
                                        value={disputeReason}
                                        onChange={(e) =>
                                            setDisputeReason(e.target.value)
                                        }
                                    />

                                    <Button variant="outlined" component="label">
                                        Прикрепить файлы
                                        <input
                                            type="file"
                                            hidden
                                            multiple
                                            onChange={(e) =>
                                                setAttachmentFiles(
                                                    Array.from(e.target.files || [])
                                                )
                                            }
                                        />
                                    </Button>

                                    <Button
                                        variant="contained"
                                        color="warning"
                                        disabled={submittingFeedback}
                                        onClick={() => handleSubmitFeedback("dispute")}
                                    >
                                        Оспорить результат
                                    </Button>
                                </Stack>
                            </CardContent>
                        </Card>
                    )}

                    <Stack spacing={2}>
                        <Typography variant="h5">
                            История обратной связи
                        </Typography>

                        {feedbackHistory.length === 0 && (
                            <Typography color="text.secondary">
                                Обратной связи пока нет.
                            </Typography>
                        )}

                        {feedbackHistory.map((item) => (
                            <Card key={item.id}>
                                <CardContent>
                                    <Stack spacing={1}>
                                        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                                            <Chip
                                                size="small"
                                                label={
                                                    item.feedback_type_label
                                                    || feedbackTypeLabels[item.feedback_type]
                                                }
                                            />
                                            {item.rating && (
                                                <Chip
                                                    size="small"
                                                    variant="outlined"
                                                    label={`Оценка: ${item.rating}`}
                                                />
                                            )}
                                            {item.is_resolved && (
                                                <Chip
                                                    size="small"
                                                    color="success"
                                                    label="Оспаривание закрыто"
                                                />
                                            )}
                                        </Stack>
                                        <Typography variant="body2" color="text.secondary">
                                            {item.author_name || `Пользователь #${item.user_id}`}
                                            {" · "}
                                            {new Date(item.created_at).toLocaleString("ru-RU")}
                                        </Typography>
                                        {item.dispute_reason && (
                                            <Typography>
                                                Причина: {item.dispute_reason}
                                            </Typography>
                                        )}
                                        {item.comment && (
                                            <Typography>{item.comment}</Typography>
                                        )}
                                        {item.resolution_comment && (
                                            <Typography color="text.secondary">
                                                Решение диспетчера: {item.resolution_comment}
                                            </Typography>
                                        )}
                                        {item.attachments?.length > 0 && (
                                            <Typography variant="caption">
                                                Вложений: {item.attachments.length}
                                            </Typography>
                                        )}
                                    </Stack>
                                </CardContent>
                            </Card>
                        ))}
                    </Stack>

                    <Divider />

                    <Card>
                        <CardContent>
                            <Stack spacing={2}>
                                <Typography variant="h6">
                                    Комментарий к заявке
                                </Typography>
                                <TextField
                                    fullWidth
                                    multiline
                                    minRows={3}
                                    label="Текст"
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                />
                                <Button
                                    variant="outlined"
                                    onClick={addComment}
                                    disabled={!text.trim()}
                                >
                                    Отправить
                                </Button>
                            </Stack>
                        </CardContent>
                    </Card>

                    <Stack spacing={2}>
                        <Typography variant="h6">Комментарии</Typography>
                        {comments.map((comment) => (
                            <Card key={comment.id}>
                                <CardContent>
                                    <Stack spacing={0.75}>
                                        <Typography variant="body2" color="text.secondary">
                                            {comment.author_name || `Пользователь #${comment.user_id}`}
                                        </Typography>
                                        {comment.author_role && (
                                            <Typography variant="caption" color="text.secondary">
                                                {roleLabels[comment.author_role] || comment.author_role}
                                            </Typography>
                                        )}
                                        <Typography>{comment.text}</Typography>
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

export default TicketDetailsPage;
