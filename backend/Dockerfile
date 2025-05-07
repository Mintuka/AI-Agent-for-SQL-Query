FROM python:3.9-slim

WORKDIR /backend

COPY requirements.txt ./
RUN pip install -r requirements.txt

COPY . .

RUN pip install gunicorn
EXPOSE 8080
ENV FLASK_APP=app.py
ENV FLASK_ENV=production
# CMD ["flask", "run", "--host=0.0.0.0", "--port=8080", "--reload"]
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "4", "--timeout", "120", "app:app"]