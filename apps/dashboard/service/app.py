from stackio import StackIO

class PythonExample(object):
    """ Various convenience methods to make things cooler. """

    def add_man(self, sentence):
        """ End a sentence with ", man!" to make it sound cooler, and
        return the result. """
        return sentence + ", man!"

    def add_42(self, n):
        """ Add 42 to an integer argument to make it cooler, and return the
        result. """
        return n + 42

    def boat(self, sentence):
        """ Replace a sentence with "I'm on a boat!", and return that,
        because it's cooler. """
        return "I'm on a boat!"

def main():
    client = StackIO()
    client.expose("example-python", "tcp://127.0.0.1:4243", PythonExample())

if __name__ == "__main__":
    main()