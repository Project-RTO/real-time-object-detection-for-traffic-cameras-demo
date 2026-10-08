
import cv2
from ultralytics import YOLO

# Load YOLO26n model
model = YOLO("yolo26n.pt")

# Open computer webcam
cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("Error: Cannot open camera")
    exit()

while True:
    ret, frame = cap.read()

    if not ret:
        print("Cannot read camera frame")
        break

    # Detect objects in the frame
    results = model.predict(frame, conf=0.4, verbose=False)

    # Draw bounding boxes and labels
    annotated_frame = results[0].plot()

    # Display the results
    cv2.imshow("YOLO26n Object Detection", annotated_frame)

    # Press Q to quit
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()
