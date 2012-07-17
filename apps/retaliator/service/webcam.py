#!/usr/bin/python
import cv2
import time
import numpy
import base64

class WebCam(object):
    def __init__(self, device_id=0):
        self.camera = cv2.VideoCapture(device_id)

    def stream(self):
        while True:
            _, f = self.camera.read()
            _, b = cv2.imencode(".jpg", f)

            x = numpy.arange(len(b), dtype=numpy.float64)
            y = base64.b64encode(x.tostring())

            if cv2.waitKey(5) == 27:
                break

            time.sleep(1.0)