import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton,
  Button, useDisclosure, Input, VStack, IconButton
} from '@chakra-ui/react';
import { FiPlus } from 'react-icons/fi';

export default function ModalAdicionarAbastecimento() {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <IconButton
        icon={<FiPlus />}
        colorScheme="blue"
        aria-label="Adicionar"
        position="fixed"
        bottom="80px"
        right="20px"
        zIndex={20}
        size="lg"
        borderRadius="full"
        boxShadow="lg"
        onClick={onOpen}
      />

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Novo Abastecimento</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={4}>
            <VStack spacing={3}>
              <Input placeholder="Tipo de Abastecimento" />
              <Input placeholder="KM Inicial" type="number" />
              <Input placeholder="KM Final" type="number" />
              <Button colorScheme="blue" w="full">Salvar</Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
