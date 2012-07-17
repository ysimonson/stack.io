#!/usr/bin/python
import retaliator
import webcam
from stackio import StackIO

def main():
    client = StackIO()
    client.expose("retaliator", "ipc:///tmp/retaliator", retaliator.Retaliator())
    #client.expose("retaliator", "tcp://127.0.0.1:4242", retaliator.Retaliator())
    #client.expose("webcam", "tcp://127.0.0.1:4243", webcam.WebCam())

if __name__ == '__main__':
    main()