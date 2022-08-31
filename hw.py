import sys

if __name__ == '__main__':
    print("argv[0]: ", sys.argv[0])
    if len(sys.argv) < 2:
        print('Hello no argument')
    else:
        print('Hello from {input}'.format(input=sys.argv[1]))
